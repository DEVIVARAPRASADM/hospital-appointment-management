const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/auditLogger');
const { generatePatientIdentifier } = require('./authService');
const bcrypt = require('bcryptjs');

// Permitted visit state transitions
const VALID_TRANSITIONS = {
  REGISTERED: ['WAITING', 'CANCELLED', 'NO_SHOW'],
  WAITING: ['CALLED', 'CANCELLED', 'NO_SHOW'],
  CALLED: ['IN_CONSULTATION', 'WAITING', 'NO_SHOW', 'CANCELLED'],
  IN_CONSULTATION: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: ['WAITING'], // Allow recall / reset to waiting if patient turns up
};

/**
 * Allocate sequential token and queue sequence inside a session atomically.
 */
async function allocateTokenAndSequence(tx, sessionId) {
  const lastVisit = await tx.visit.findFirst({
    where: { sessionId },
    orderBy: { tokenNumber: 'desc' },
  });

  const nextToken = (lastVisit?.tokenNumber || 0) + 1;

  const lastQueue = await tx.visit.findFirst({
    where: { sessionId },
    orderBy: { queueSequence: 'desc' },
  });

  const nextQueueSequence = (lastQueue?.queueSequence || 0) + 1;

  return { tokenNumber: nextToken, queueSequence: nextQueueSequence };
}

/**
 * Check in a confirmed appointment and generate token.
 */
async function checkInAppointment(appointmentId, actorUserId) {
  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { user: true } },
        availability: {
          include: {
            session: {
              include: {
                branch: { include: { location: true } },
                doctor: { include: { user: true } },
              },
            },
          },
        },
        visits: true,
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.status === 'CANCELLED') {
      throw new AppError('Cannot check in a cancelled appointment', 400);
    }

    // Prevent duplicate active visits for the same appointment
    const activeVisit = appointment.visits.find(
      (v) => !['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(v.status)
    );
    if (activeVisit) {
      throw new AppError(`Patient has already been checked in (Token #${activeVisit.tokenNumber})`, 409);
    }

    const { tokenNumber, queueSequence } = await allocateTokenAndSequence(tx, appointment.availability.sessionId);

    const visit = await tx.visit.create({
      data: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        sessionId: appointment.availability.sessionId,
        visitType: 'APPOINTMENT',
        tokenNumber,
        queueSequence,
        status: 'WAITING',
        checkedInAt: new Date(),
        registeredByUserId: actorUserId || null,
      },
      include: {
        patient: { include: { user: true } },
        session: {
          include: {
            doctor: { include: { user: true } },
            branch: { include: { location: true } },
            department: true,
          },
        },
      },
    });

    await logAudit({
      actorUserId,
      action: 'CHECK_IN_APPOINTMENT',
      entityType: 'Visit',
      entityId: visit.id,
      metadata: { appointmentId, tokenNumber, sessionId: appointment.availability.sessionId },
    });

    return visit;
  });
}

/**
 * Register a walk-in patient directly into an active/scheduled doctor session.
 */
async function registerWalkIn({ patientId, newPatientData, sessionId }, actorUserId) {
  if (!sessionId) {
    throw new AppError('Doctor session ID is required for walk-in registration', 400);
  }

  return prisma.$transaction(async (tx) => {
    const session = await tx.doctorSession.findUnique({
      where: { id: sessionId },
      include: {
        doctor: { include: { user: true } },
        branch: { include: { location: true } },
        department: true,
      },
    });

    if (!session) {
      throw new AppError('Doctor session not found', 404);
    }
    if (['CANCELLED', 'COMPLETED'].includes(session.status)) {
      throw new AppError('Cannot register walk-in for a cancelled or completed session', 400);
    }

    let finalPatientId = patientId;

    // If new patient needs creation at the reception desk
    if (!finalPatientId && newPatientData) {
      const { name, phone, gender, email } = newPatientData;
      if (!name) {
        throw new AppError('Patient name is required for walk-in registration', 400);
      }

      const generatedEmail = email || `walkin.${Date.now()}.${Math.floor(Math.random() * 1000)}@carepoint.local`;
      const passwordHash = await bcrypt.hash('CarePoint@2026', 10);
      const patientIdentifier = await generatePatientIdentifier();

      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: generatedEmail.toLowerCase().trim(),
          passwordHash,
          role: 'PATIENT',
          accountStatus: 'ACTIVE',
        },
      });

      const newPatient = await tx.patient.create({
        data: {
          userId: newUser.id,
          patientIdentifier,
          phone: phone || null,
          gender: gender || null,
        },
      });

      finalPatientId = newPatient.id;
    }

    if (!finalPatientId) {
      throw new AppError('Either an existing patientId or newPatientData must be provided', 400);
    }

    const { tokenNumber, queueSequence } = await allocateTokenAndSequence(tx, sessionId);

    const visit = await tx.visit.create({
      data: {
        patientId: finalPatientId,
        sessionId,
        visitType: 'WALK_IN',
        tokenNumber,
        queueSequence,
        status: 'WAITING',
        checkedInAt: new Date(),
        registeredByUserId: actorUserId || null,
      },
      include: {
        patient: { include: { user: true } },
        session: {
          include: {
            doctor: { include: { user: true } },
            branch: { include: { location: true } },
            department: true,
          },
        },
      },
    });

    await logAudit({
      actorUserId,
      action: 'REGISTER_WALK_IN',
      entityType: 'Visit',
      entityId: visit.id,
      metadata: { patientId: finalPatientId, sessionId, tokenNumber },
    });

    return visit;
  });
}

/**
 * Update visit status respecting permitted state machine transitions.
 */
async function updateVisitStatus(visitId, nextStatus, actorUser) {
  return prisma.$transaction(async (tx) => {
    const visit = await tx.visit.findUnique({
      where: { id: visitId },
      include: {
        session: true,
        patient: { include: { user: true } },
      },
    });

    if (!visit) {
      throw new AppError('Visit record not found', 404);
    }

    const allowedNext = VALID_TRANSITIONS[visit.status] || [];
    if (!allowedNext.includes(nextStatus)) {
      throw new AppError(
        `Invalid status transition from '${visit.status}' to '${nextStatus}'. Permitted: [${allowedNext.join(', ')}]`,
        400
      );
    }

    const updateData = { status: nextStatus };
    if (nextStatus === 'CALLED') updateData.calledAt = new Date();
    if (nextStatus === 'IN_CONSULTATION') updateData.startedAt = new Date();
    if (nextStatus === 'COMPLETED') updateData.completedAt = new Date();

    const updated = await tx.visit.update({
      where: { id: visitId },
      data: updateData,
      include: {
        patient: { include: { user: true } },
        session: {
          include: {
            doctor: { include: { user: true } },
            branch: { include: { location: true } },
          },
        },
      },
    });

    // If completed and tied to an appointment, mark appointment as COMPLETED
    if (nextStatus === 'COMPLETED' && visit.appointmentId) {
      await tx.appointment.update({
        where: { id: visit.appointmentId },
        data: { status: 'COMPLETED' },
      });
    }

    await logAudit({
      actorUserId: actorUser.id,
      action: 'UPDATE_VISIT_STATUS',
      entityType: 'Visit',
      entityId: visit.id,
      metadata: { from: visit.status, to: nextStatus },
    });

    return updated;
  });
}

/**
 * Call Next patient in queue for a session.
 */
async function callNextPatient(sessionId, actorUser) {
  return prisma.$transaction(async (tx) => {
    // Look for currently called or in-consultation visit
    const currentlyInConsultation = await tx.visit.findFirst({
      where: { sessionId, status: 'IN_CONSULTATION' },
    });
    if (currentlyInConsultation) {
      throw new AppError('A patient is currently in consultation. Please complete it first.', 400);
    }

    // Find the next waiting patient ordered by queueSequence
    const nextPatient = await tx.visit.findFirst({
      where: { sessionId, status: 'WAITING' },
      orderBy: { queueSequence: 'asc' },
    });

    if (!nextPatient) {
      throw new AppError('No waiting patients in queue for this session', 404);
    }

    return updateVisitStatus(nextPatient.id, 'CALLED', actorUser);
  });
}

/**
 * Get active queue for a doctor session.
 */
async function getSessionQueue(sessionId) {
  return prisma.visit.findMany({
    where: {
      sessionId,
      status: { not: 'CANCELLED' },
    },
    include: {
      patient: { include: { user: true } },
      triageRecords: {
        include: { nurse: { include: { user: true } } },
        orderBy: { recordedAt: 'desc' },
      },
    },
    orderBy: { queueSequence: 'asc' },
  });
}

/**
 * Reception Desk Consolidated View: Sessions, Counts, and Queue
 */
async function getReceptionDashboardData(branchId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const whereSession = {
    startTime: { gte: todayStart, lte: todayEnd },
  };
  if (branchId) {
    whereSession.branchId = branchId;
  }

  const sessions = await prisma.doctorSession.findMany({
    where: whereSession,
    include: {
      doctor: { include: { user: true } },
      branch: { include: { location: true } },
      department: true,
      availabilities: {
        include: {
          appointments: {
            where: { status: { not: 'CANCELLED' } },
          },
        },
      },
      visits: {
        include: {
          patient: { include: { user: true } },
        },
      },
    },
    orderBy: { startTime: 'asc' },
  });

  // Calculate live authoritative metrics for each session
  const sessionSummaries = sessions.map((s) => {
    const bookedAppointments = s.availabilities.reduce(
      (acc, a) => acc + a.appointments.length,
      0
    );
    const arrivedPatients = s.visits.length;
    const walkIns = s.visits.filter((v) => v.visitType === 'WALK_IN').length;
    const waitingPatients = s.visits.filter((v) => v.status === 'WAITING').length;
    const inConsultation = s.visits.filter((v) => v.status === 'IN_CONSULTATION').length;
    const completedVisits = s.visits.filter((v) => v.status === 'COMPLETED').length;
    const noShows = s.visits.filter((v) => v.status === 'NO_SHOW').length;

    return {
      id: s.id,
      doctorId: s.doctorId,
      doctorName: s.doctor.user.name,
      specialty: s.doctor.specialty,
      branchName: s.branch.name,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
      delayMinutes: s.delayMinutes,
      delayReason: s.delayReason,
      delayUpdatedAt: s.delayUpdatedAt,
      metrics: {
        bookedAppointments,
        arrivedPatients,
        walkIns,
        waitingPatients,
        inConsultation,
        completedVisits,
        noShows,
      },
    };
  });

  return {
    date: new Date().toISOString().split('T')[0],
    sessions: sessionSummaries,
  };
}

module.exports = {
  checkInAppointment,
  registerWalkIn,
  updateVisitStatus,
  callNextPatient,
  getSessionQueue,
  getReceptionDashboardData,
};
