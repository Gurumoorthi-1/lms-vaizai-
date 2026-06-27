import mongoose from 'mongoose';

const liveSessionSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    default: 60
  },
  meetingUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  recordingUrl: {
    type: String
  },
  recordingMetadata: {
    provider: String,
    fileSize: Number,
    durationSeconds: Number,
    uploadedAt: Date
  },
  transcript: {
    type: String
  },
  aiSummary: {
    type: String
  },
  meetingNotes: {
    type: String
  },
  maxParticipants: {
    type: Number,
    default: 100
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  }
}, { timestamps: true });

const LiveSession = mongoose.model('LiveSession', liveSessionSchema);
export default LiveSession;
