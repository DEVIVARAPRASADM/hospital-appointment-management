const doctorService = require('../services/doctorService');

async function getAllDoctors(req, res, next) {
  try {
    const doctors = await doctorService.getAllDoctors({
      specialty: req.query.specialty,
      branchId: req.query.branchId,
      search: req.query.search,
    });
    res.status(200).json({ status: 'success', data: { doctors } });
  } catch (error) {
    next(error);
  }
}

async function getDoctorById(req, res, next) {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    res.status(200).json({ status: 'success', data: { doctor } });
  } catch (error) {
    next(error);
  }
}

async function getDoctorAvailability(req, res, next) {
  try {
    const slots = await doctorService.getDoctorAvailability(req.params.id, {
      date: req.query.date,
      branchId: req.query.branchId,
    });
    res.status(200).json({ status: 'success', data: { slots } });
  } catch (error) {
    next(error);
  }
}

async function createSession(req, res, next) {
  try {
    const session = await doctorService.createDoctorSession(req.body, req.user.id);
    res.status(201).json({ status: 'success', data: { session } });
  } catch (error) {
    next(error);
  }
}

async function generateSlots(req, res, next) {
  try {
    const slots = await doctorService.generateSessionSlots(
      req.params.id,
      req.body.slotDurationMinutes,
      req.user.id
    );
    res.status(201).json({ status: 'success', data: { slots } });
  } catch (error) {
    next(error);
  }
}

async function updateDelay(req, res, next) {
  try {
    const session = await doctorService.updateSessionDelay(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(200).json({ status: 'success', data: { session } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllDoctors,
  getDoctorById,
  getDoctorAvailability,
  createSession,
  generateSlots,
  updateDelay,
};
