const hospitalService = require('../services/hospitalService');

async function getAllHospitals(req, res, next) {
  try {
    const hospitals = await hospitalService.getAllHospitals();
    res.status(200).json({ status: 'success', data: { hospitals } });
  } catch (error) {
    next(error);
  }
}

async function getHospitalById(req, res, next) {
  try {
    const hospital = await hospitalService.getHospitalById(req.params.id);
    res.status(200).json({ status: 'success', data: { hospital } });
  } catch (error) {
    next(error);
  }
}

async function getHospitalBranches(req, res, next) {
  try {
    const branches = await hospitalService.getHospitalBranches(req.params.id);
    res.status(200).json({ status: 'success', data: { branches } });
  } catch (error) {
    next(error);
  }
}

async function getBranchById(req, res, next) {
  try {
    const branch = await hospitalService.getBranchById(req.params.id);
    res.status(200).json({ status: 'success', data: { branch } });
  } catch (error) {
    next(error);
  }
}

async function getBranchLocation(req, res, next) {
  try {
    const location = await hospitalService.getBranchLocation(req.params.id);
    res.status(200).json({ status: 'success', data: { location } });
  } catch (error) {
    next(error);
  }
}

async function createHospital(req, res, next) {
  try {
    const hospital = await hospitalService.createHospital(req.body, req.user.id);
    res.status(201).json({ status: 'success', data: { hospital } });
  } catch (error) {
    next(error);
  }
}

async function createBranch(req, res, next) {
  try {
    const branch = await hospitalService.createBranch(req.params.id, req.body, req.user.id);
    res.status(201).json({ status: 'success', data: { branch } });
  } catch (error) {
    next(error);
  }
}

async function getAllDepartments(req, res, next) {
  try {
    const departments = await hospitalService.getAllDepartments(req.query.hospitalId);
    res.status(200).json({ status: 'success', data: { departments } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllHospitals,
  getHospitalById,
  getHospitalBranches,
  getBranchById,
  getBranchLocation,
  createHospital,
  createBranch,
  getAllDepartments,
};
