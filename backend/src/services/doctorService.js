const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/auditLogger');

async function getAllDoctors({ specialty, branchId, search }) {
  const where = {
    isActive: true,
    user: { accountStatus: 'ACTIVE' },
  };

  if (specialty) {
    where.specialty = { equals: specialty, mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { specialty: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (branchId) {
    where.sessions = {
      some: {
        branchId,
        status: { in: ['SCHEDULED', 'ACTIVE'] },
      },
    };
  }

  return prisma.doctor.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      sessions: {
        where: {
          status: { in: ['SCHEDULED', 'ACTIVE'] },
          endTime: { gte: new Date() },
        },
        include: {
          branch: {
            include: { location: true },
          },
          department: true,
        },
        orderBy: { startTime: 'asc' },
      },
    },
    orderBy: { user: { name: 'asc' } },
  });
}

async function getDoctorById(id) {
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      sessions: {
        where: {
          status: { in: ['SCHEDULED', 'ACTIVE'] },
        },
        include: {
          branch: {
            include: { location: true },
          },
          department: true,
          availabilities: {
            where: { status: 'OPEN' },
            orderBy: { startTime: 'asc' },
          },
        },
        orderBy: { startTime: 'asc' },
      },
    },
  });

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  return doctor;
}

async function getDoctorAvailability(doctorId, { date, branchId }) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor || !doctor.isActive) {
    throw new AppError('Doctor is either not found or currently inactive', 404);
  }

  const where = {
    doctorId,
    status: 'OPEN',
    startTime: { gte: new Date() }, // past slots cannot be newly booked
    session: {
      status: { in: ['SCHEDULED', 'ACTIVE'] },
    },
  };

  if (branchId) {
    where.session.branchId = branchId;
  }

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    where.startTime = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  return prisma.availability.findMany({
    where,
    include: {
      session: {
        include: {
          branch: { include: { location: true } },
          department: true,
        },
      },
      appointments: {
        where: { status: { not: 'CANCELLED' } },
      },
    },
    orderBy: { startTime: 'asc' },
  });
}

async function createDoctorSession({ doctorId, branchId, departmentId, startTime, endTime }, actorUserId) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError('Valid start time and end time are required', 400);
  }
  if (end <= start) {
    throw new AppError('Session end time must be later than start time', 400);
  }

  // Prevent overlapping sessions for the same doctor
  const overlapping = await prisma.doctorSession.findFirst({
    where: {
      doctorId,
      status: { in: ['SCHEDULED', 'ACTIVE'] },
      OR: [
        {
          startTime: { lte: start },
          endTime: { gt: start },
        },
        {
          startTime: { lt: end },
          endTime: { gte: end },
        },
        {
          startTime: { gte: start },
          endTime: { lte: end },
        },
      ],
    },
  });

  if (overlapping) {
    throw new AppError('Doctor already has a scheduled or active session during this time window', 409);
  }

  const session = await prisma.doctorSession.create({
    data: {
      doctorId,
      branchId,
      departmentId: departmentId || null,
      startTime: start,
      endTime: end,
      status: 'SCHEDULED',
    },
    include: {
      doctor: { include: { user: true } },
      branch: true,
    },
  });

  await logAudit({
    actorUserId,
    action: 'CREATE_DOCTOR_SESSION',
    entityType: 'DoctorSession',
    entityId: session.id,
    metadata: { doctorId, branchId, startTime, endTime },
  });

  return session;
}

// Generate discrete availability slots within a session
async function generateSessionSlots(sessionId, slotDurationMinutes = 15, actorUserId) {
  const session = await prisma.doctorSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) {
    throw new AppError('Doctor session not found', 404);
  }
  if (session.status === 'CANCELLED' || session.status === 'COMPLETED') {
    throw new AppError('Cannot generate slots for a cancelled or completed session', 400);
  }

  const slots = [];
  let currentStart = new Date(session.startTime);
  const sessionEnd = new Date(session.endTime);

  while (new Date(currentStart.getTime() + slotDurationMinutes * 60000) <= sessionEnd) {
    const slotEnd = new Date(currentStart.getTime() + slotDurationMinutes * 60000);
    slots.push({
      doctorId: session.doctorId,
      sessionId: session.id,
      startTime: new Date(currentStart),
      endTime: slotEnd,
      status: 'OPEN',
    });
    currentStart = slotEnd;
  }

  // Insert slots, skipping any duplicates
  const createdSlots = await prisma.$transaction(
    slots.map((slot) =>
      prisma.availability.upsert({
        where: {
          doctorId_startTime: {
            doctorId: slot.doctorId,
            startTime: slot.startTime,
          },
        },
        update: {},
        create: slot,
      })
    )
  );

  await logAudit({
    actorUserId,
    action: 'GENERATE_SESSION_SLOTS',
    entityType: 'DoctorSession',
    entityId: session.id,
    metadata: { slotCount: createdSlots.length, slotDurationMinutes },
  });

  return createdSlots;
}

async function updateSessionDelay(sessionId, { delayMinutes, delayReason }, actorUserId) {
  const delay = parseInt(delayMinutes, 10);
  if (isNaN(delay) || delay < 0) {
    throw new AppError('Delay minutes must be a non-negative integer', 400);
  }

  const session = await prisma.doctorSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) {
    throw new AppError('Session not found', 404);
  }

  const updatedSession = await prisma.doctorSession.update({
    where: { id: sessionId },
    data: {
      delayMinutes: delay,
      delayReason: delayReason || null,
      delayUpdatedAt: new Date(),
    },
    include: {
      doctor: { include: { user: true } },
      branch: true,
    },
  });

  await logAudit({
    actorUserId,
    action: 'UPDATE_SESSION_DELAY',
    entityType: 'DoctorSession',
    entityId: sessionId,
    metadata: { delayMinutes: delay, delayReason },
  });

  return updatedSession;
}

module.exports = {
  getAllDoctors,
  getDoctorById,
  getDoctorAvailability,
  createDoctorSession,
  generateSessionSlots,
  updateSessionDelay,
};
