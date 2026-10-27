const express = require('express');
const router = express.Router();
const receptionController = require('../controllers/receptionController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('RECEPTIONIST', 'ADMIN'));

router.get('/dashboard', receptionController.getReceptionDashboard);
router.get('/patients/search', receptionController.searchPatients);
router.post('/visits/walk-in', receptionController.registerWalkIn);
router.post('/visits/:id/check-in', receptionController.checkIn);
router.get('/sessions/:sessionId/queue', receptionController.getSessionQueue);
router.patch('/visits/:id/status', receptionController.updateVisitStatus);
router.post('/sessions/:sessionId/call-next', receptionController.callNext);

module.exports = router;
