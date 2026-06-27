import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mcq', 'true_false', 'text'],
    default: 'mcq'
  },
  text: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    default: []
  },
  correctOption: {
    type: Number, // Index of correct option (for MCQ/TF)
    required: function() { return this.type !== 'text'; }
  },
  points: {
    type: Number,
    default: 1
  },
  explanation: {
    type: String
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  questions: [questionSchema],
  passingScore: {
    type: Number,
    default: 70 // Passing percentage (e.g. 70%)
  },
  durationMinutes: {
    type: Number,
    default: 0 // 0 means no time limit
  },
  maxAttempts: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
