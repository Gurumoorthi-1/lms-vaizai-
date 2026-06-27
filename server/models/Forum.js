import mongoose from 'mongoose';

const forumReplySchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorRole: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  parentReplyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumReply',
    default: null
  },
  upvotes: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const forumQuestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorRole: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  category: {
    type: String,
    default: 'General'
  },
  votes: {
    type: Number,
    default: 0
  },
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarkedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  replies: [forumReplySchema]
}, { timestamps: true });

const ForumQuestion = mongoose.model('ForumQuestion', forumQuestionSchema);

export default ForumQuestion;
