import { adminRepository } from '../repository/admin.repository.js';
import { auditRepository } from '../repository/audit.repository.js';
import redisClient from '../config/redis.js';

const SETTINGS_CACHE_KEY = 'settings:all';

export const adminService = {
  updateUserRole: async (targetUserId, role, adminUser, ipAddress) => {
    const updatedUser = await adminRepository.updateUserRole(targetUserId, role);
    if (!updatedUser) throw new Error('User not found');

    // Create Audit Log
    await auditRepository.create({
      userId: adminUser._id,
      action: 'UPDATE_ROLE',
      resource: 'User',
      resourceId: targetUserId,
      details: { newRole: role, email: updatedUser.email },
      ipAddress
    });

    return updatedUser;
  },

  updateUserStatus: async (targetUserId, status, adminUser, ipAddress) => {
    const updatedUser = await adminRepository.updateUserStatus(targetUserId, status);
    if (!updatedUser) throw new Error('User not found');

    // Create Audit Log
    await auditRepository.create({
      userId: adminUser._id,
      action: status === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
      resource: 'User',
      resourceId: targetUserId,
      details: { email: updatedUser.email },
      ipAddress
    });

    return updatedUser;
  },

  getAuditLogs: async (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filters = {};
    if (query.userId) filters.userId = query.userId;
    if (query.action) filters.action = query.action;
    if (query.resource) filters.resource = query.resource;

    const logs = await adminRepository.findAuditLogs(filters, skip, limit);
    const total = await adminRepository.countAuditLogs(filters);

    return {
      logs,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  },

  updateSetting: async (key, value, adminUser, ipAddress) => {
    const setting = await adminRepository.updateSetting(key, value, adminUser._id);
    
    // Invalidate Redis settings cache
    await redisClient.del(SETTINGS_CACHE_KEY);
    await redisClient.del(`settings:key:${key}`);

    // Create Audit Log
    await auditRepository.create({
      userId: adminUser._id,
      action: 'UPDATE_SETTING',
      resource: 'SystemSetting',
      details: { key, value },
      ipAddress
    });

    return setting;
  },

  getSetting: async (key) => {
    const cacheKey = `settings:key:${key}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const setting = await adminRepository.getSettingByKey(key);
    if (setting) {
      await redisClient.setEx(cacheKey, 86400, JSON.stringify(setting.value)); // Cache for 24h
      return setting.value;
    }
    return null;
  },

  getAllSettings: async () => {
    const cached = await redisClient.get(SETTINGS_CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const settings = await adminRepository.getAllSettings();
    await redisClient.setEx(SETTINGS_CACHE_KEY, 86400, JSON.stringify(settings));
    return settings;
  }
};
