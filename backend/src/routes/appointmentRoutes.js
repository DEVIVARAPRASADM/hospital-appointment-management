const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');

router.post('/appointments', authenticate, appointmentController.bookAppointment);
router.get('/appointments/my', authenticate, appointmentController.getMyAppointments);
router.get('/appointments/:id', authenticate, appointmentController.getAppointmentById);
router.patch('/appointments/:id/cancel', authenticate, appointmentController.cancelAppointment);

module.exports = router;
