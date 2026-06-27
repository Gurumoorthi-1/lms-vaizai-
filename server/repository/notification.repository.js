import Notification from '../models/Notification.js';

export const notificationRepository = {
  create: async (data) => {
    return await Notification.create(data);
  },

  createMany: async (docs) => {
    return await Notification.insertMany(docs);
  },

  findByUser: async (userId, { isRead, limit = 20, skip = 0 } = {}) => {
    const filter = { userId };
    if (typeof isRead === 'boolean') filter.isRead = isRead;

    return await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  },

  countByUser: async (userId, filter = {}) => {
    return await Notification.countDocuments({ userId, ...filter });
  },

  markAsRead: async (notificationId, userId) => {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  },

  markAllAsRead: async (userId) => {
    return await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  },

  deleteById: async (id, userId) => {
    return await Notification.findOneAndDelete({ _id: id, userId });
  }
};
