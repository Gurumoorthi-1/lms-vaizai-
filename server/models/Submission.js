import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: {
    type: String,
    required: false
  },
  content: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'late'],
    default: 'submitted'
  },
  marks: {
    type: Number
  },
  teacherFeedback: {
    type: String
  },
  aiFeedback: {
    type: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isLate: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
