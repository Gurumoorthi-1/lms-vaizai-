import AuditLog from '../models/AuditLog.js';

export const auditRepository = {
  create: async (logData) => {
    return await AuditLog.create(logData);
  },

  findByUser: async (userId, limit = 50) => {
    return await AuditLog.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  },

  findByResource: async (resource, resourceId, limit = 50) => {
    return await AuditLog.find({ resource, resourceId }).sort({ createdAt: -1 }).limit(limit);
  }
};
