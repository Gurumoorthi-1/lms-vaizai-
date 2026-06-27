import User from '../models/User.js';

export const studentRepository = {
  findAllStudents: async (filters = {}, skip = 0, limit = 10, sort = { createdAt: -1 }) => {
    return await User.find({ ...filters, role: 'STUDENT' })
      .select('-password -verificationOTP -resetPasswordToken -deviceHistory')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  },

  countStudents: async (filters = {}) => {
    return await User.countDocuments({ ...filters, role: 'STUDENT' });
  },

  findById: async (id) => {
    return await User.findOne({ _id: id, role: 'STUDENT' }).select('-password');
  },

  addBookmark: async (studentId, courseId) => {
    return await User.findByIdAndUpdate(studentId, { $addToSet: { bookmarks: courseId } }, { new: true });
  },

  removeBookmark: async (studentId, courseId) => {
    return await User.findByIdAndUpdate(studentId, { $pull: { bookmarks: courseId } }, { new: true });
  },

  addWishlist: async (studentId, courseId) => {
    return await User.findByIdAndUpdate(studentId, { $addToSet: { wishlist: courseId } }, { new: true });
  },

  removeWishlist: async (studentId, courseId) => {
    return await User.findByIdAndUpdate(studentId, { $pull: { wishlist: courseId } }, { new: true });
  },
  
  awardAchievement: async (studentId, achievement) => {
    return await User.findByIdAndUpdate(studentId, { $push: { achievements: achievement } }, { new: true });
  }
};
