import LiveSession from '../models/LiveSession.js';

export const liveSessionRepository = {
  create: async (data) => {
    return await LiveSession.create(data);
  },

  findById: async (id) => {
    return await LiveSession.findById(id)
      .populate('hostId', 'firstName lastName email')
      .populate('courseId', 'title');
  },

  findByCourse: async (courseId, limit = 20, skip = 0) => {
    return await LiveSession.find({ courseId })
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('hostId', 'firstName lastName');
  },

  countByCourse: async (courseId) => {
    return await LiveSession.countDocuments({ courseId });
  },

  findUpcoming: async (courseId) => {
    return await LiveSession.find({
      courseId,
      status: { $in: ['scheduled', 'live'] },
      scheduledAt: { $gte: new Date() }
    }).sort({ scheduledAt: 1 });
  },

  updateById: async (id, data) => {
    return await LiveSession.findByIdAndUpdate(id, data, { new: true });
  },

  deleteById: async (id) => {
    return await LiveSession.findByIdAndDelete(id);
  },

  findAll: async (filters = {}, sort = { scheduledAt: -1 }, skip = 0, limit = 10) => {
    return await LiveSession.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('hostId', 'firstName lastName email')
      .populate('courseId', 'title');
  },

  countAll: async (filters = {}) => {
    return await LiveSession.countDocuments(filters);
  }
};
