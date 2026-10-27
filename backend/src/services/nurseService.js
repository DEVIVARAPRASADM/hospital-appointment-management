const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/auditLogger');

/**
 * Nurse queue: returns all visits awaiting or undergoing triage
 */
async function getNurseQueue(branchId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const where = {
    status: { in: ['WAITING', 'CALLED'] },
    checkedInAt: { gte: todayStart },
  };

  if (branchId) {
    where.session = { branchId };
  }

  return prisma.visit.findMany({
    where,
    include: {
      patient: { include: { user: true } },
      session: {
        include: {
          doctor: { include: { user: true } },
          branch: true,
          department: true,
        },
      },
      triageRecords: {
        include: { nurse: { include: { user: true } } },
        orderBy: { recordedAt: 'desc' },
      },
    },
    orderBy: { queueSequence: 'asc' },
  });
}

/**
 * Record triage observations (vitals, notes) for a visit
 */
async function recordTriage(visitId, triageData, nurseUserId) {
  const { bloodPressure, temperature, pulseRate, oxygenSaturation, notes } = triageData;

  const nurse = await prisma.nurse.findUnique({
    where: { userId: nurseUserId },
  });
  if (!nurse) {
    throw new AppError('Only authenticated nurses can record triage observations', 403);
  }

  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
  });
  if (!visit) {
    throw new AppError('Visit record not found', 404);
  }

  // Range validation for clinical safety
  if (temperature && (temperature < 90 || temperature > 110)) {
    throw new AppError('Temperature reading must be between 90°F and 110°F', 400);
  }
  if (pulseRate && (pulseRate < 30 || pulseRate > 250)) {
    throw new AppError('Pulse rate must be between 30 and 250 bpm', 400);
  }
  if (oxygenSaturation && (oxygenSaturation < 50 || oxygenSaturation > 100)) {
    throw new AppError('Oxygen saturation must be between 50% and 100%', 400);
  }

  const triage = await prisma.triageRecord.create({
    data: {
      visitId,
      nurseId: nurse.id,
      bloodPressure: bloodPressure || null,
      temperature: temperature ? parseFloat(temperature) : null,
      pulseRate: pulseRate ? parseInt(pulseRate, 10) : null,
      oxygenSaturation: oxygenSaturation ? parseFloat(oxygenSaturation) : null,
      notes: notes || null,
    },
    include: {
      nurse: { include: { user: true } },
      visit: {
        include: {
          patient: { include: { user: true } },
        },
      },
    },
  });

  await logAudit({
    actorUserId: nurseUserId,
    action: 'RECORD_TRIAGE',
    entityType: 'TriageRecord',
    entityId: triage.id,
    metadata: { visitId, nurseId: nurse.id },
  });

  return triage;
}

async function getVisitTriage(visitId) {
  return prisma.triageRecord.findMany({
    where: { visitId },
    include: { nurse: { include: { user: true } } },
    orderBy: { recordedAt: 'desc' },
  });
}

module.exports = {
  getNurseQueue,
  recordTriage,
  getVisitTriage,
};
