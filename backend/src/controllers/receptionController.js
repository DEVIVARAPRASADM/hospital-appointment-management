const visitService = require('../services/visitService');
const prisma = require('../config/db');

async function getReceptionDashboard(req, res, next) {
  try {
    const data = await visitService.getReceptionDashboardData(req.query.branchId);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

async function searchPatients(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(200).json({ status: 'success', data: { patients: [] } });
    }

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { patientIdentifier: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { user: { name: { contains: q, mode: 'insensitive' } } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
          {
            appointments: {
              some: { bookingReference: { contains: q, mode: 'insensitive' } },
            },
          },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        appointments: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            availability: {
              include: { doctor: { include: { user: true } } },
            },
          },
        },
      },
      take: 20,
    });

    res.status(200).json({ status: 'success', data: { patients } });
  } catch (error) {
    next(error);
  }
}

async function registerWalkIn(req, res, next) {
  try {
    const visit = await visitService.registerWalkIn(req.body, req.user.id);
    res.status(201).json({ status: 'success', data: { visit } });
  } catch (error) {
    next(error);
  }
}

async function checkIn(req, res, next) {
  try {
    const visit = await visitService.checkInAppointment(req.params.id, req.user.id);
    res.status(201).json({ status: 'success', data: { visit } });
  } catch (error) {
    next(error);
  }
}

async function getSessionQueue(req, res, next) {
  try {
    const queue = await visitService.getSessionQueue(req.params.sessionId);
    res.status(200).json({ status: 'success', data: { queue } });
  } catch (error) {
    next(error);
  }
}

async function updateVisitStatus(req, res, next) {
  try {
    const visit = await visitService.updateVisitStatus(
      req.params.id,
      req.body.status,
      req.user
    );
    res.status(200).json({ status: 'success', data: { visit } });
  } catch (error) {
    next(error);
  }
}

async function callNext(req, res, next) {
  try {
    const visit = await visitService.callNextPatient(req.params.sessionId, req.user);
    res.status(200).json({ status: 'success', data: { visit } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReceptionDashboard,
  searchPatients,
  registerWalkIn,
  checkIn,
  getSessionQueue,
  updateVisitStatus,
  callNext,
};
