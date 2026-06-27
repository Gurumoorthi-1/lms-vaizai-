import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Optional if action performed by system or unauthenticated user
  },
  action: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    required: true // e.g., "Course", "User", "Auth"
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: mongoose.Schema.Types.Mixed // JSON object of changes or metadata
  },
  ipAddress: {
    type: String
  }
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
