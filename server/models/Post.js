import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: String,
  reportedAt: { type: Date, default: Date.now }
}, { _id: false });

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
    // Only top-level questions require a title — replies don't
  },
  body: {
    type: String,
    required: true,
    trim: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  tags: [{ type: String, lowercase: true, trim: true }],
  type: {
    type: String,
    enum: ['question', 'answer', 'reply'],
    default: 'question'
  },
  // For answers and nested replies — references the parent post/answer
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isResolved: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  reports: [reportSchema],
  viewCount: {
    type: Number,
    default: 0
  },
  answerCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Full-text search index on title and body
postSchema.index({ title: 'text', body: 'text', tags: 'text' });
// Index for fast parent-child lookups
postSchema.index({ parentId: 1, createdAt: -1 });
// Index for course and category filtering
postSchema.index({ courseId: 1, categoryId: 1, isDeleted: 1 });

const Post = mongoose.model('Post', postSchema);
export default Post;
