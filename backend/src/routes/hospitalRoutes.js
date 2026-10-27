const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/hospitals', hospitalController.getAllHospitals);
router.get('/hospitals/:id', hospitalController.getHospitalById);
router.get('/hospitals/:id/branches', hospitalController.getHospitalBranches);
router.get('/branches/:id', hospitalController.getBranchById);
router.get('/branches/:id/location', hospitalController.getBranchLocation);
router.get('/departments', hospitalController.getAllDepartments);

// Admin-only management endpoints
router.post('/hospitals', authenticate, authorize('ADMIN'), hospitalController.createHospital);
router.post('/hospitals/:id/branches', authenticate, authorize('ADMIN'), hospitalController.createBranch);

module.exports = router;
