import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  progress: {
    type: Number,
    default: 0
  },
  completedChapters: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  watchTimeSeconds: {
    type: Number,
    default: 0
  },
  quizScores: [{
    quizId: mongoose.Schema.Types.ObjectId,
    score: Number,
    maxScore: Number
  }],
  assignmentScores: [{
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
    score: Number,
    maxScore: Number
  }],
  learningStreak: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date }
  },
  completedLessons: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped'],
    default: 'active'
  }
}, { timestamps: true });

// Prevent duplicate enrollments
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
