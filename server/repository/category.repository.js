import Category from '../models/Category.js';

export const categoryRepository = {
  create: async (data) => {
    return await Category.create(data);
  },

  findAll: async () => {
    return await Category.find({ isActive: true }).sort({ name: 1 });
  },

  findById: async (id) => {
    return await Category.findById(id);
  },

  findBySlug: async (slug) => {
    return await Category.findOne({ slug, isActive: true });
  },

  // Find by slug OR name (case-insensitive) — used when frontend sends category as a string label
  findByNameOrSlug: async (nameOrSlug) => {
    return await Category.findOne({
      isActive: true,
      $or: [
        { slug: nameOrSlug.toLowerCase().replace(/\s+/g, '-') },
        { name: { $regex: new RegExp(`^${nameOrSlug}$`, 'i') } }
      ]
    });
  },

  update: async (id, data) => {
    return await Category.findByIdAndUpdate(id, data, { new: true });
  },

  incrementPostCount: async (id) => {
    return await Category.findByIdAndUpdate(id, { $inc: { postCount: 1 } });
  },

  decrementPostCount: async (id) => {
    return await Category.findByIdAndUpdate(id, { $inc: { postCount: -1 } });
  }
};
