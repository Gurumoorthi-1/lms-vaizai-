import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  duration: {
    type: String
  },
  price: {
    type: Number,
    default: 0
  },
  thumbnail: {
    type: String
  },
  tags: [String],
  chapters: [{
    title: String,
    description: String,
    order: Number,
    lessons: [{
      title: String,
      description: String,
      type: { type: String, enum: ['video', 'reading', 'quiz', 'assignment'], default: 'video' },
      contentUrl: String,
      videoMetadata: {
        durationSeconds: Number,
        resolution: String,
        provider: String // e.g., 'vimeo', 'aws-s3'
      },
      order: Number
    }]
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'restored'],
    default: 'draft'
  },
  version: {
    type: Number,
    default: 1
  },
  isLatestVersion: {
    type: Boolean,
    default: true
  },
  previousVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);

export default Course;
