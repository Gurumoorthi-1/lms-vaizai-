import Course from '../models/Course.js';

export const courseRepository = {
  create: async (courseData) => {
    return await Course.create(courseData);
  },

  findById: async (id) => {
    return await Course.findById(id).populate('teacherId', 'firstName lastName email');
  },

  findAll: async (filters = {}, sort = { createdAt: -1 }, skip = 0, limit = 10) => {
    return await Course.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('teacherId', 'firstName lastName');
  },

  count: async (filters = {}) => {
    return await Course.countDocuments(filters);
  },

  updateById: async (id, updateData) => {
    return await Course.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  },

  deleteById: async (id) => {
    return await Course.findByIdAndDelete(id);
  },

  findLatestVersion: async (previousVersionId) => {
    return await Course.findOne({ previousVersionId, isLatestVersion: true });
  }
};
