import Certificate from '../models/Certificate.js';

export const certificateRepository = {
  create: async (data) => {
    return await Certificate.create(data);
  },

  findByCertificateId: async (certificateId) => {
    return await Certificate.findOne({ certificateId: { $regex: new RegExp(`^${certificateId}$`, 'i') } })
      .populate('studentId', 'firstName lastName email')
      .populate('courseId', 'title category level');
  },

  findByStudentAndCourse: async (studentId, courseId) => {
    return await Certificate.findOne({ studentId, courseId });
  },

  findByStudent: async (studentId) => {
    return await Certificate.find({ studentId, status: 'active' })
      .populate('studentId', 'firstName lastName')
      .populate('courseId', 'title thumbnail');
  },

  findAll: async () => {
    return await Certificate.find({ status: 'active' })
      .populate('studentId', 'firstName lastName')
      .populate('courseId', 'title thumbnail');
  },

  search: async (query, skip = 0, limit = 10) => {
    return await Certificate.find(query)
      .populate('studentId', 'firstName lastName email')
      .populate('courseId', 'title')
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(limit);
  },

  count: async (query) => {
    return await Certificate.countDocuments(query);
  },

  revoke: async (certificateId, reason) => {
    return await Certificate.findOneAndUpdate(
      { certificateId },
      { status: 'revoked', revokedAt: new Date(), revokeReason: reason },
      { new: true }
    );
  },

  updateById: async (id, data) => {
    return await Certificate.findByIdAndUpdate(id, data, { new: true });
  }
};
