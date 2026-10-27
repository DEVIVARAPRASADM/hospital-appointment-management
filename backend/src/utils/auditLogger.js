const prisma = require('../config/db');

async function logAudit({ actorUserId, action, entityType, entityId, metadata = {} }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: actorUserId || null,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        metadata: metadata ? metadata : undefined,
      },
    });
  } catch (error) {
    // Log error internally without breaking main transactional flows
    console.error('Failed to write audit log:', error.message);
  }
}

module.exports = {
  logAudit,
};
