import AuditLog from '../models/AuditLog.js';

export const logAuditEvent = async ({
  user,
  action,
  entity,
  entityId,
  details = '',
  oldValue = null,
  newValue = null,
  ipAddress = '127.0.0.1',
}) => {
  try {
    const auditEntry = new AuditLog({
      user: user?._id || null,
      userName: user?.name || 'System',
      userEmail: user?.email || '',
      userRole: user?.role || 'SYSTEM',
      action,
      entity,
      entityId: String(entityId),
      details,
      oldValue,
      newValue,
      ipAddress,
      timestamp: new Date(),
    });
    await auditEntry.save();
  } catch (error) {
    console.error('[AuditLog Error]', error.message);
  }
};
