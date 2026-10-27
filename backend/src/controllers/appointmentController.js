const appointmentService = require('../services/appointmentService');
const AppError = require('../utils/AppError');

async function bookAppointment(req, res, next) {
  try {
    let patientId = req.body.patientId;
    if (req.user.role === 'PATIENT') {
      if (!req.user.patient) {
        throw new AppError('Patient profile not found for this account', 400);
      }
      patientId = req.user.patient.id;
    }

    const appointment = await appointmentService.bookAppointment(
      {
        patientId,
        availabilityId: req.body.availabilityId,
        reason: req.body.reason,
      },
      req.user.id
    );

    res.status(201).json({ status: 'success', data: { appointment } });
  } catch (error) {
    next(error);
  }
}

async function getMyAppointments(req, res, next) {
  try {
    if (!req.user.patient) {
      return res.status(200).json({ status: 'success', data: { appointments: [] } });
    }
    const appointments = await appointmentService.getPatientAppointments(req.user.patient.id);
    res.status(200).json({ status: 'success', data: { appointments } });
  } catch (error) {
    next(error);
  }
}

async function getAppointmentById(req, res, next) {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id, req.user);
    res.status(200).json({ status: 'success', data: { appointment } });
  } catch (error) {
    next(error);
  }
}

async function cancelAppointment(req, res, next) {
  try {
    const appointment = await appointmentService.cancelAppointment(
      req.params.id,
      req.body.cancellationReason,
      req.user
    );
    res.status(200).json({ status: 'success', data: { appointment } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
};
