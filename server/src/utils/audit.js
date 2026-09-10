const AuditLog = require('../models/AuditLog');

const writeAudit = async ({ userId, action, entity, entityId, before, after, meta }) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entity,
      entityId,
      before,
      after,
      meta,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = { writeAudit };
