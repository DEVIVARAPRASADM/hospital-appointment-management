const express = require('express');
const router = express.Router();
const nurseController = require('../controllers/nurseController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('NURSE', 'ADMIN', 'DOCTOR'));

router.get('/queue', nurseController.getNurseQueue);
router.post('/visits/:id/triage', nurseController.recordTriage);
router.get('/visits/:id/triage', nurseController.getVisitTriage);

module.exports = router;
