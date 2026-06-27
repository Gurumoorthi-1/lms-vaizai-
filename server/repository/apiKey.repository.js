import ApiKey from '../models/ApiKey.js';

export const apiKeyRepository = {
  create: async (data) => {
    return await ApiKey.create(data);
  },

  findByUser: async (userId) => {
    return await ApiKey.find({ userId });
  },

  deleteById: async (id, userId) => {
    return await ApiKey.findOneAndDelete({ _id: id, userId });
  },

  findByKey: async (key) => {
    return await ApiKey.findOne({ key }).populate('userId');
  }
};
