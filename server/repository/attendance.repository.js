import Attendance from '../models/Attendance.js';

export const attendanceRepository = {
  upsertJoin: async (sessionId, userId) => {
    return await Attendance.findOneAndUpdate(
      { sessionId, userId },
      { $setOnInsert: { sessionId, userId, joinedAt: new Date(), status: 'present' } },
      { upsert: true, new: true }
    );
  },

  recordLeave: async (sessionId, userId) => {
    const record = await Attendance.findOne({ sessionId, userId });
    if (!record) return null;

    const leftAt = new Date();
    const durationMinutes = Math.round((leftAt - record.joinedAt) / 60000);

    return await Attendance.findOneAndUpdate(
      { sessionId, userId },
      { leftAt, durationMinutes },
      { new: true }
    );
  },

  findBySession: async (sessionId) => {
    return await Attendance.find({ sessionId })
      .populate('userId', 'firstName lastName email role');
  },

  findByUser: async (userId, limit = 20) => {
    return await Attendance.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sessionId', 'title scheduledAt courseId');
  },

  countPresent: async (sessionId) => {
    return await Attendance.countDocuments({ sessionId, status: { $in: ['present', 'late'] } });
  },

  updateStatus: async (attendanceId, status) => {
    return await Attendance.findByIdAndUpdate(attendanceId, { status }, { new: true });
  }
};

