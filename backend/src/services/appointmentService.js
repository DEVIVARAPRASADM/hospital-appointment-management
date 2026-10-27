const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/auditLogger');

function generateBookingReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'BK-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

/**
 * Concurrency-safe atomic appointment booking.
 * Guaranteed by transaction isolation + PostgreSQL partial unique index on (availability_id) WHERE status != 'CANCELLED'.
 */
async function bookAppointment({ patientId, availabilityId, reason }, actorUserId) {
  if (!patientId || !availabilityId) {
    throw new AppError('Patient ID and Availability Slot ID are required', 400);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Fetch availability slot with its session and doctor
    const slot = await tx.availability.findUnique({
      where: { id: availabilityId },
      include: {
        doctor: {
          include: { user: true },
        },
        session: {
          include: {
            branch: { include: { location: true } },
            department: true,
          },
        },
      },
    });

    if (!slot) {
      throw new AppError('The requested availability slot does not exist', 404);
    }

    if (slot.status !== 'OPEN') {
      throw new AppError('This slot is closed and not available for booking', 409);
    }

    // Disallow booking past slots
    if (new Date(slot.startTime) < new Date()) {
      throw new AppError('Cannot book past appointment slots', 400);
    }

    // Verify session is active/scheduled
    if (slot.session.status === 'CANCELLED' || slot.session.status === 'COMPLETED') {
      throw new AppError('Cannot book an appointment for a cancelled or completed session', 409);
    }

    // Verify doctor and branch are active
    if (!slot.doctor.isActive || !slot.session.branch.isActive) {
      throw new AppError('The selected doctor or hospital branch is currently inactive', 409);
    }

    // 2. Concurrency check: Ensure no active appointment currently occupies this slot
    const existingActiveAppointment = await tx.appointment.findFirst({
      where: {
        availabilityId,
        status: { not: 'CANCELLED' },
      },
    });

    if (existingActiveAppointment) {
      throw new AppError('This slot has already been booked by another patient', 409);
    }

    // 3. Generate unique booking reference
    let bookingReference = generateBookingReference();
    let collision = await tx.appointment.findUnique({ where: { bookingReference } });
    while (collision) {
      bookingReference = generateBookingReference();
      collision = await tx.appointment.findUnique({ where: { bookingReference } });
    }

    // 4. Create appointment
    const appointment = await tx.appointment.create({
      data: {
        bookingReference,
        patientId,
        availabilityId,
        reason: reason || null,
        status: 'CONFIRMED',
      },
      include: {
        patient: { include: { user: true } },
        availability: {
          include: {
            doctor: { include: { user: true } },
            session: {
              include: {
                branch: { include: { location: true } },
                department: true,
              },
            },
          },
        },
      },
    });

    await logAudit({
      actorUserId: actorUserId || appointment.patient.userId,
      action: 'BOOK_APPOINTMENT',
      entityType: 'Appointment',
      entityId: appointment.id,
      metadata: { bookingReference, patientId, availabilityId },
    });

    return appointment;
  });
}

/**
 * Cancel an appointment while strictly preserving historical audit data.
 */
async function cancelAppointment(appointmentId, cancellationReason, actorUser) {
  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        visits: true,
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Ownership check: If caller is a patient, they can only cancel their own appointment
    if (actorUser.role === 'PATIENT' && appointment.patient.userId !== actorUser.id) {
      throw new AppError('Forbidden: You can only cancel your own appointments', 403);
    }

    if (appointment.status === 'CANCELLED') {
      throw new AppError('Appointment has already been cancelled', 400);
    }

    if (appointment.status === 'COMPLETED') {
      throw new AppError('Cannot cancel an appointment that has already been completed', 400);
    }

    // A cancelled appointment must not silently remain an active visit
    if (appointment.visits && appointment.visits.some((v) => ['IN_CONSULTATION', 'COMPLETED'].includes(v.status))) {
      throw new AppError('Cannot cancel an appointment with an active or completed visit', 400);
    }

    const updated = await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        cancellationReason: cancellationReason || 'Cancelled by user',
      },
      include: {
        patient: { include: { user: true } },
        availability: {
          include: {
            doctor: { include: { user: true } },
            session: { include: { branch: true } },
          },
        },
      },
    });

    // Cancel any registered visits for this appointment
    await tx.visit.updateMany({
      where: {
        appointmentId,
        status: { in: ['REGISTERED', 'WAITING'] },
      },
      data: {
        status: 'CANCELLED',
      },
    });

    await logAudit({
      actorUserId: actorUser.id,
      action: 'CANCEL_APPOINTMENT',
      entityType: 'Appointment',
      entityId: appointment.id,
      metadata: { cancellationReason, previousStatus: appointment.status },
    });

    return updated;
  });
}

async function getPatientAppointments(patientId) {
  return prisma.appointment.findMany({
    where: { patientId },
    include: {
      availability: {
        include: {
          doctor: { include: { user: true } },
          session: {
            include: {
              branch: { include: { location: true } },
              department: true,
            },
          },
        },
      },
      visits: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getAppointmentById(appointmentId, actorUser) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { include: { user: true } },
      availability: {
        include: {
          doctor: { include: { user: true } },
          session: {
            include: {
              branch: { include: { location: true } },
              department: true,
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

  // Cross-patient boundary check
  if (actorUser.role === 'PATIENT' && appointment.patient.userId !== actorUser.id) {
    throw new AppError('Forbidden: Access to another patient record is denied', 403);
  }

  return appointment;
}

module.exports = {
  bookAppointment,
  cancelAppointment,
  getPatientAppointments,
  getAppointmentById,
};
