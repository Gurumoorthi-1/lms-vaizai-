import User from '../models/User.js';

export const userRepository = {
  create: async (userData) => {
    return await User.create(userData);
  },

  findByEmail: async (email) => {
    return await User.findOne({ email });
  },

  findById: async (id) => {
    return await User.findById(id).select('-password');
  },

  updateById: async (id, updateData) => {
    return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-password');
  },

  findByResetToken: async (token) => {
    return await User.findOne({ resetPasswordToken: token, resetPasswordExpire: { $gt: Date.now() } });
  },
  
  updateDeviceHistory: async (userId, deviceInfo) => {
    return await User.findByIdAndUpdate(
      userId,
      { $push: { deviceHistory: deviceInfo } },
      { new: true }
    );
  }
};
