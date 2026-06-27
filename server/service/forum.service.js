import { postRepository } from '../repository/post.repository.js';
import { categoryRepository } from '../repository/category.repository.js';
import redisClient from '../config/redis.js';

const CACHE_TTL = 300; // 5 minutes
const AUTO_FLAG_THRESHOLD = 5; // Auto-flag post after 5 reports

const invalidateForumCache = async (keys = []) => {
  const pipeline = redisClient.multi();
  keys.forEach(k => pipeline.del(k));
  await pipeline.exec();
};

const transformPost = (post) => {
  const obj = post.toObject ? post.toObject() : post;
  return {
    id: obj._id,
    title: obj.title,
    description: obj.body,
    content: obj.body, // For replies, front-end uses 'content'!
    category: obj.categoryId?.name || 'General',
    tags: obj.tags || [],
    votes: obj.likes?.length || 0,
    views: obj.viewCount || 0,
    authorName: obj.authorId ? `${obj.authorId.firstName} ${obj.authorId.lastName}` : 'Anonymous',
    authorRole: obj.authorId?.role || 'STUDENT',
    createdAt: obj.createdAt,
    isPinned: obj.isPinned || false,
    bookmarks: obj.bookmarks || [],
    replies: obj.replies ? obj.replies.map(transformPost) : []
  };
};

export const forumService = {
  // ─── Questions ──────────────────────────────────────────────────────────────

  createQuestion: async (data, user) => {
    // Resolve category: prefer explicit categoryId, else look up by name string
    let resolvedCategoryId = data.categoryId || null;
    if (!resolvedCategoryId && data.category) {
      const cat = await categoryRepository.findByNameOrSlug(data.category);
      if (cat) resolvedCategoryId = cat._id;
    }

    const post = await postRepository.create({
      title: data.title,
      body: data.description,
      tags: data.tags,
      authorId: user._id,
      categoryId: resolvedCategoryId,
      type: 'question'
    });

    if (resolvedCategoryId) {
      await categoryRepository.incrementPostCount(resolvedCategoryId);
    }

    await invalidateForumCache(['forum:list:default']);
    return transformPost(post);
  },

  getQuestions: async (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filters
    const filters = { type: 'question' };
    if (query.courseId) filters.courseId = query.courseId;
    if (query.category) filters.categoryId = query.category;
    if (query.tag) filters.tags = query.tag;
    if (query.resolved === 'true') filters.isResolved = true;
    if (query.resolved === 'false') filters.isResolved = false;

    // Sorting
    const sort = {};
    if (query.sortBy === 'likes') sort['likes'] = -1;
    else if (query.sortBy === 'viewCount') sort.viewCount = -1;
    else if (query.sortBy === 'answerCount') sort.answerCount = -1;
    else sort.createdAt = -1;

    // Text search bypasses cache — too dynamic to cache effectively
    if (query.search) {
      const results = await postRepository.search(query.search, filters, skip, limit);
      const total = results.length;
      const transformedPosts = [];
      for (const post of results) {
        const replies = await postRepository.findReplies(post._id);
        const repliesWithNested = await Promise.all(
          replies.map(async (reply) => {
            const nested = await postRepository.findReplies(reply._id);
            return transformPost({ ...reply.toObject(), replies: nested });
          })
        );
        transformedPosts.push({ ...transformPost(post), replies: repliesWithNested });
      }
      return transformedPosts;
    }

    // Cache only simple default list
    const isDefault = Object.keys(query).length === 0;
    if (isDefault) {
      const cached = await redisClient.get('forum:list:default');
      if (cached) return JSON.parse(cached);
    }

    const posts = await postRepository.findAll(filters, skip, limit, sort);
    const transformedPosts = [];
    for (const post of posts) {
      const replies = await postRepository.findReplies(post._id);
      const repliesWithNested = await Promise.all(
        replies.map(async (reply) => {
          const nested = await postRepository.findReplies(reply._id);
          return transformPost({ ...reply.toObject(), replies: nested });
        })
      );
      transformedPosts.push({ ...transformPost(post), replies: repliesWithNested });
    }

    if (isDefault) {
      await redisClient.setEx('forum:list:default', CACHE_TTL, JSON.stringify(transformedPosts));
    }

    return transformedPosts;
  },

  getPostById: async (id) => {
    const post = await postRepository.findById(id);
    if (!post) throw new Error('Post not found');

    // Increment view count (fire and forget)
    postRepository.incrementView(id).catch(() => {});

    // Fetch immediate replies
    const replies = await postRepository.findReplies(id);

    // For each reply, fetch its nested replies
    const repliesWithNested = await Promise.all(
      replies.map(async (reply) => {
        const nested = await postRepository.findReplies(reply._id);
        return transformPost({ ...reply.toObject(), replies: nested });
      })
    );

    return { ...transformPost(post), replies: repliesWithNested };
  },

  // ─── Replies ────────────────────────────────────────────────────────────────

  createReply: async (parentId, content, user) => {
    const parent = await postRepository.findById(parentId);
    if (!parent) throw new Error('Parent post not found');

    // Determine type: answer if replying to question, reply otherwise
    const type = parent.type === 'question' ? 'answer' : 'reply';

    const reply = await postRepository.create({
      body: content,
      authorId: user._id,
      type,
      parentId,
      courseId: parent.courseId,
      categoryId: parent.categoryId
    });

    // Increment answer count on the root question
    const rootId = parent.type === 'question' ? parentId : parent.parentId;
    if (rootId) await postRepository.incrementAnswerCount(rootId);

    // Invalidate the forum cache because replies were added!
    await invalidateForumCache(['forum:list:default']);

    // Now return the updated parent post with all replies
    return forumService.getPostById(rootId || parentId);
  },

  // ─── Interactions ────────────────────────────────────────────────────────────

  toggleLike: async (postId, userId) => {
    const post = await postRepository.findById(postId);
    if (!post) throw new Error('Post not found');
    const updated = await postRepository.toggleLike(postId, userId);
    return transformPost(updated);
  },

  toggleBookmark: async (postId, userId) => {
    const post = await postRepository.findById(postId);
    if (!post) throw new Error('Post not found');
    const updated = await postRepository.toggleBookmark(postId, userId);
    return transformPost(updated);
  },

  getMyBookmarks: async (userId, query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    return await postRepository.getBookmarkedByUser(userId, skip, limit);
  },

  // ─── Reporting ───────────────────────────────────────────────────────────────

  reportPost: async (postId, userId, reason) => {
    const post = await postRepository.findById(postId);
    if (!post) throw new Error('Post not found');

    const alreadyReported = post.reports?.some(r => r.reportedBy?.toString() === userId.toString());
    if (alreadyReported) throw new Error('You have already reported this post');

    const updated = await postRepository.addReport(postId, { reportedBy: userId, reason });

    // Auto-flag if threshold exceeded
    if (updated.reports.length >= AUTO_FLAG_THRESHOLD) {
      await postRepository.update(postId, { isFlagged: true });
    }

    return { message: 'Post reported successfully' };
  },

  // ─── Moderation ─────────────────────────────────────────────────────────────

  deletePost: async (postId, user) => {
    const post = await postRepository.findById(postId);
    if (!post) throw new Error('Post not found');

    const isOwner = post.authorId._id.toString() === user._id.toString();
    const isModerator = ['ADMIN', 'MODERATOR'].includes(user.role);

    if (!isOwner && !isModerator) throw new Error('Not authorized to delete this post');

    await postRepository.softDelete(postId);

    if (post.categoryId) {
      await categoryRepository.decrementPostCount(post.categoryId);
    }

    await invalidateForumCache(['forum:list:default']);
    return { message: 'Post deleted successfully' };
  },

  pinPost: async (postId, user) => {
    if (!['ADMIN', 'MODERATOR', 'INSTRUCTOR'].includes(user.role)) {
      throw new Error('Not authorized to pin posts');
    }
    return await postRepository.update(postId, { isPinned: true });
  },

  markResolved: async (postId, user) => {
    const post = await postRepository.findById(postId);
    if (!post) throw new Error('Post not found');

    if (post.authorId._id.toString() !== user._id.toString() && !['ADMIN', 'MODERATOR'].includes(user.role)) {
      throw new Error('Only the question author or moderator can mark it resolved');
    }

    return await postRepository.update(postId, { isResolved: true });
  },

  getFlaggedPosts: async (skip = 0, limit = 10) => {
    const posts = await postRepository.findAll({ isFlagged: true }, skip, limit, { createdAt: -1 });
    return posts;
  },

  clearFlag: async (postId) => {
    return await postRepository.update(postId, { isFlagged: false, reports: [] });
  },

  // ─── Categories ──────────────────────────────────────────────────────────────

  createCategory: async (data) => {
    return await categoryRepository.create(data);
  },

  getCategories: async () => {
    const cacheKey = 'forum:categories';
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const categories = await categoryRepository.findAll();
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(categories));
    return categories;
  }
};
