const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/doctors', doctorController.getAllDoctors);
router.get('/doctors/:id', doctorController.getDoctorById);
router.get('/doctors/:id/availability', doctorController.getDoctorAvailability);

// Session management
router.post('/sessions', authenticate, authorize('ADMIN', 'DOCTOR'), doctorController.createSession);
router.post('/sessions/:id/slots', authenticate, authorize('ADMIN', 'DOCTOR'), doctorController.generateSlots);
router.patch('/sessions/:id/delay', authenticate, authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), doctorController.updateDelay);

module.exports = router;
