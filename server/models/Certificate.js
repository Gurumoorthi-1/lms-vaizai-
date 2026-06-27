import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
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
  certificateId: {
    type: String,
    required: true,
    unique: true  // UUID-based public identifier
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C', 'Pass']
  },
  score: {
    type: Number
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  pdfUrl: {
    type: String
  },
  qrCodeUrl: {
    type: String
  },
  verificationUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'revoked'],
    default: 'active'
  },
  revokedAt: {
    type: Date
  },
  revokeReason: {
    type: String
  },
  metadata: {
    instructorName: String,
    courseDuration: String,
    completionDate: Date
  }
}, { timestamps: true });

certificateSchema.index({ studentId: 1, courseId: 1 });

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
