const nurseService = require('../services/nurseService');

async function getNurseQueue(req, res, next) {
  try {
    const queue = await nurseService.getNurseQueue(req.query.branchId);
    res.status(200).json({ status: 'success', data: { queue } });
  } catch (error) {
    next(error);
  }
}

async function recordTriage(req, res, next) {
  try {
    const triage = await nurseService.recordTriage(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(201).json({ status: 'success', data: { triage } });
  } catch (error) {
    next(error);
  }
}

async function getVisitTriage(req, res, next) {
  try {
    const triage = await nurseService.getVisitTriage(req.params.id);
    res.status(200).json({ status: 'success', data: { triage } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNurseQueue,
  recordTriage,
  getVisitTriage,
};
