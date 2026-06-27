import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import SystemSetting from '../models/SystemSetting.js';

export const adminRepository = {
  updateUserRole: async (userId, role) => {
    return await User.findByIdAndUpdate(userId, { $set: { role } }, { new: true }).select('-password');
  },

  updateUserStatus: async (userId, status) => {
    return await User.findByIdAndUpdate(userId, { $set: { status } }, { new: true }).select('-password');
  },

  findAuditLogs: async (filters = {}, skip = 0, limit = 50) => {
    return await AuditLog.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName email role');
  },

  countAuditLogs: async (filters = {}) => {
    return await AuditLog.countDocuments(filters);
  },

  updateSetting: async (key, value, updatedBy) => {
    return await SystemSetting.findOneAndUpdate(
      { key },
      { $set: { value, updatedBy } },
      { upsert: true, new: true }
    );
  },

  getSettingByKey: async (key) => {
    return await SystemSetting.findOne({ key });
  },

  getAllSettings: async () => {
    return await SystemSetting.find({});
  }
};
