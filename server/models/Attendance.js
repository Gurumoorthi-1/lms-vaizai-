import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveSession',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'late', 'absent'],
    default: 'present'
  }
}, { timestamps: true });

// Compound index: one attendance record per user per session
attendanceSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
