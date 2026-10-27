const adminService = require('../services/adminService');

async function getDashboard(req, res, next) {
  try {
    const stats = await adminService.getAdminDashboardStats();
    res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    next(error);
  }
}

async function createStaff(req, res, next) {
  try {
    const staff = await adminService.createStaffUser(req.body, req.user.id);
    res.status(201).json({ status: 'success', data: { staff } });
  } catch (error) {
    next(error);
  }
}

async function getAllStaff(req, res, next) {
  try {
    const staff = await adminService.getAllStaff();
    res.status(200).json({ status: 'success', data: { staff } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
  createStaff,
  getAllStaff,
};
