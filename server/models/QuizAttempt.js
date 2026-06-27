import mongoose from 'mongoose';

const attemptAnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedOption: {
    type: Number // Index of selected option
  },
  answerText: {
    type: String // For text-based answers
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  pointsEarned: {
    type: Number,
    default: 0
  }
});

const quizAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  answers: [attemptAnswerSchema],
  score: {
    type: Number, // Percentage score (e.g. 85%)
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;
