import Post from '../models/Post.js';

export const postRepository = {
  create: async (data) => {
    return await Post.create(data);
  },

  findById: async (id) => {
    return await Post.findOne({ _id: id, isDeleted: false })
      .populate('authorId', 'firstName lastName role')
      .populate('categoryId', 'name slug');
  },

  findAll: async (filters = {}, skip = 0, limit = 10, sort = { createdAt: -1 }) => {
    const query = { ...filters, isDeleted: false };
    return await Post.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'firstName lastName')
      .populate('categoryId', 'name slug');
  },

  countAll: async (filters = {}) => {
    return await Post.countDocuments({ ...filters, isDeleted: false });
  },

  // Full-text search using MongoDB $text index
  search: async (query, filters = {}, skip = 0, limit = 10) => {
    return await Post.find(
      { $text: { $search: query }, isDeleted: false, ...filters },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'firstName lastName');
  },

  // Fetch nested replies for a post (all levels)
  findReplies: async (parentId) => {
    return await Post.find({ parentId, isDeleted: false })
      .sort({ createdAt: 1 })
      .populate('authorId', 'firstName lastName role');
  },

  update: async (id, data) => {
    return await Post.findByIdAndUpdate(id, data, { new: true });
  },

  softDelete: async (id) => {
    return await Post.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  },

  toggleLike: async (postId, userId) => {
    const post = await Post.findById(postId);
    const alreadyLiked = post.likes.includes(userId);
    const update = alreadyLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };
    return await Post.findByIdAndUpdate(postId, update, { new: true });
  },

  toggleBookmark: async (postId, userId) => {
    const post = await Post.findById(postId);
    const alreadyBookmarked = post.bookmarks.includes(userId);
    const update = alreadyBookmarked
      ? { $pull: { bookmarks: userId } }
      : { $addToSet: { bookmarks: userId } };
    return await Post.findByIdAndUpdate(postId, update, { new: true });
  },

  addReport: async (postId, report) => {
    return await Post.findByIdAndUpdate(
      postId,
      { $push: { reports: report } },
      { new: true }
    );
  },

  incrementView: async (postId) => {
    return await Post.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } });
  },

  incrementAnswerCount: async (postId) => {
    return await Post.findByIdAndUpdate(postId, { $inc: { answerCount: 1 } });
  },

  getBookmarkedByUser: async (userId, skip = 0, limit = 10) => {
    return await Post.find({ bookmarks: userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'firstName lastName');
  }
};
