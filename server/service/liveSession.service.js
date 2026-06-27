import { liveSessionRepository } from '../repository/liveSession.repository.js';
import { attendanceRepository } from '../repository/attendance.repository.js';
import { aiService } from './ai.service.js';
import redisClient from '../config/redis.js';
import { getIO } from '../config/socket.js';

const CACHE_TTL = 300; // 5 minutes for live session lists

// Transform session to frontend expected format
const transformSession = (session) => {
  const statusMap = {
    scheduled: 'UPCOMING',
    live: 'LIVE',
    ended: 'COMPLETED',
    cancelled: 'CANCELLED'
  };

  const obj = session.toObject ? session.toObject() : session;
  return {
    id: obj._id,
    _id: obj._id,
    title: obj.title,
    description: obj.description,
    courseId: obj.courseId?._id || obj.courseId,
    courseTitle: obj.courseId?.title || 'General',
    instructorName: obj.hostId ? `${obj.hostId.firstName} ${obj.hostId.lastName}` : 'Instructor',
    scheduledAt: obj.scheduledAt,
    startTime: obj.scheduledAt, // For compatibility
    durationMinutes: obj.durationMinutes || 60,
    durationMins: obj.durationMinutes || 60, // For compatibility
    meetingUrl: obj.meetingUrl,
    status: statusMap[obj.status] || 'UPCOMING',
    recordingUrl: obj.recordingUrl,
    aiNotes: obj.aiSummary,
    aiSummary: obj.aiSummary,
    attendanceCount: 0, // Can be computed later
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

export const liveSessionService = {
  createSession: async (data, user) => {
    const session = await liveSessionRepository.create({
      ...data,
      hostId: user._id,
      status: 'scheduled'
    });

    // Invalidate cache
    await redisClient.del(`sessions:upcoming:${data.courseId}`);
    await redisClient.del('sessions:all');

    const populated = await liveSessionRepository.findById(session._id);
    return transformSession(populated);
  },

  getSessionById: async (id) => {
    const session = await liveSessionRepository.findById(id);
    return transformSession(session);
  },

  getSessionsByCourse: async (courseId, query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const sessions = await liveSessionRepository.findByCourse(courseId, limit, skip);
    const total = await liveSessionRepository.countByCourse(courseId);

    return {
      sessions: sessions.map(transformSession),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  },

  getUpcomingSessions: async (courseId) => {
    const cacheKey = `sessions:upcoming:${courseId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const sessions = await liveSessionRepository.findUpcoming(courseId);
    const transformed = sessions.map(transformSession);
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(transformed));
    return transformed;
  },

  startSession: async (sessionId, user) => {
    const session = await liveSessionRepository.findById(sessionId);
    if (!session) throw new Error('Session not found');

    const hostIdStr = session.hostId ? (session.hostId._id || session.hostId).toString() : null;
    if (hostIdStr && hostIdStr !== user._id.toString() && user.role !== 'ADMIN') {
      throw new Error('Only the host can start this session');
    }

    if (session.status === 'live') throw new Error('Session is already live');
    if (session.status === 'ended') throw new Error('Session has already ended');

    const updated = await liveSessionRepository.updateById(sessionId, {
      status: 'live',
      startedAt: new Date()
    });

    // Invalidate cache and emit socket event
    await redisClient.del(`sessions:upcoming:${session.courseId}`);
    await redisClient.del('sessions:all');
    try {
      getIO().to(`course:${session.courseId}`).emit('session:started', {
        sessionId,
        title: session.title,
        hostId: user._id
      });
    } catch {
      // Socket not critical — log and continue
    }

    const populated = await liveSessionRepository.findById(sessionId);
    return transformSession(populated);
  },

  endSession: async (sessionId, user) => {
    const session = await liveSessionRepository.findById(sessionId);
    if (!session) throw new Error('Session not found');

    const hostIdStr = session.hostId ? (session.hostId._id || session.hostId).toString() : null;
    if (hostIdStr && hostIdStr !== user._id.toString() && user.role !== 'ADMIN') {
      throw new Error('Only the host can end this session');
    }

    const updated = await liveSessionRepository.updateById(sessionId, {
      status: 'ended',
      endedAt: new Date()
    });

    await redisClient.del(`sessions:upcoming:${session.courseId}`);
    await redisClient.del('sessions:all');
    try {
      getIO().to(`session:${sessionId}`).emit('session:ended', { sessionId });
    } catch {
      // Socket not critical
    }

    const populated = await liveSessionRepository.findById(sessionId);
    return transformSession(populated);
  },

  joinSession: async (sessionId, user) => {
    const session = await liveSessionRepository.findById(sessionId);
    if (!session) throw new Error('Session not found');

    if (session.status !== 'live') throw new Error('Session is not currently live');

    // Determine if joining late (> 10 mins after start)
    const isLate = session.startedAt && (new Date() - session.startedAt) > 600000;

    const attendance = await attendanceRepository.upsertJoin(sessionId, user._id);

    if (isLate) {
      await attendanceRepository.updateStatus(attendance._id, 'late');
    }

    try {
      getIO().to(`session:${sessionId}`).emit('user:joined', {
        userId: user._id,
        name: `${user.firstName} ${user.lastName}`
      });
    } catch {
      // Socket not critical
    }

    return { message: 'Joined successfully', meetingUrl: session.meetingUrl };
  },

  leaveSession: async (sessionId, userId) => {
    const attendance = await attendanceRepository.recordLeave(sessionId, userId);

    try {
      getIO().to(`session:${sessionId}`).emit('user:left', { userId });
    } catch {
      // Socket not critical
    }

    return attendance;
  },

  updateSession: async (id, data, user) => {
    const session = await liveSessionRepository.findById(id);
    if (!session) throw new Error('Session not found');

    const hostIdStr = session.hostId ? (session.hostId._id || session.hostId).toString() : null;
    if (hostIdStr && hostIdStr !== user._id.toString() && user.role !== 'ADMIN') {
      throw new Error('Not authorized to update this session');
    }

    const updated = await liveSessionRepository.updateById(id, data);
    // Invalidate cache
    await redisClient.del(`sessions:upcoming:${session.courseId}`);
    await redisClient.del('sessions:all');

    const populated = await liveSessionRepository.findById(id);
    return transformSession(populated);
  },

  cancelSession: async (id, user) => {
    const session = await liveSessionRepository.findById(id);
    if (!session) throw new Error('Session not found');

    const hostIdStr = session.hostId ? (session.hostId._id || session.hostId).toString() : null;
    if (hostIdStr && hostIdStr !== user._id.toString() && user.role !== 'ADMIN') {
      throw new Error('Not authorized to cancel this session');
    }

    if (session.status === 'ended' || session.status === 'cancelled') {
      throw new Error('Session is already ended or cancelled');
    }

    const updated = await liveSessionRepository.updateById(id, { status: 'cancelled' });
    // Invalidate cache
    await redisClient.del(`sessions:upcoming:${session.courseId}`);
    await redisClient.del('sessions:all');

    const populated = await liveSessionRepository.findById(id);
    return transformSession(populated);
  },

  uploadTranscriptAndSummarize: async (sessionId, transcript, user) => {
    const session = await liveSessionRepository.findById(sessionId);
    if (!session) throw new Error('Session not found');

    const hostIdStr = session.hostId ? (session.hostId._id || session.hostId).toString() : null;
    if (hostIdStr !== user._id.toString() && user.role !== 'ADMIN') {
      throw new Error('Not authorized');
    }

    // Save transcript first
    await liveSessionRepository.updateById(sessionId, { transcript });

    // Generate AI Summary using our existing AI service
    const summaryPrompt = `Summarize the following live class transcript into:
1. Key topics covered
2. Important discussion points
3. Action items or homework mentioned

Transcript:
"""${transcript.substring(0, 4000)}"""`;

    const aiSummary = await aiService.generateSummary(user._id, summaryPrompt);

    const updated = await liveSessionRepository.updateById(sessionId, { aiSummary });
    return updated;
  },

  updateRecordingMetadata: async (sessionId, metadata, user) => {
    const session = await liveSessionRepository.findById(sessionId);
    if (!session) throw new Error('Session not found');

    const hostIdStr = session.hostId ? (session.hostId._id || session.hostId).toString() : null;
    if (hostIdStr !== user._id.toString() && user.role !== 'ADMIN') {
      throw new Error('Not authorized');
    }

    return await liveSessionRepository.updateById(sessionId, {
      recordingUrl: metadata.recordingUrl,
      recordingMetadata: {
        provider: metadata.provider,
        fileSize: metadata.fileSize,
        durationSeconds: metadata.durationSeconds,
        uploadedAt: new Date()
      }
    });
  },

  getAttendance: async (sessionId, user) => {
    const session = await liveSessionRepository.findById(sessionId);
    if (!session) throw new Error('Session not found');

    const hostIdStr = session.hostId ? (session.hostId._id || session.hostId).toString() : null;
    if (hostIdStr && hostIdStr !== user._id.toString() && user.role !== 'ADMIN') {
      throw new Error('Not authorized to view attendance');
    }

    const attendance = await attendanceRepository.findBySession(sessionId);
    const presentCount = await attendanceRepository.countPresent(sessionId);

    return { attendance, presentCount, totalRecords: attendance.length };
  },

  getMyAttendance: async (userId) => {
    return await attendanceRepository.findByUser(userId);
  },

  getAllSessions: async (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50; // More than enough
    const skip = (page - 1) * limit;
    const filters = {};

    if (query.status) {
      // Map frontend status back to backend
      const statusMap = {
        UPCOMING: 'scheduled',
        LIVE: 'live',
        COMPLETED: 'ended',
        CANCELLED: 'cancelled'
      };
      filters.status = statusMap[query.status] || query.status;
    }

    const cacheKey = 'sessions:all';
    if (Object.keys(query).length === 0) {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const sessions = await liveSessionRepository.findAll(filters, { scheduledAt: -1 }, skip, limit);
    const total = await liveSessionRepository.countAll(filters);
    const transformed = sessions.map(transformSession);

    const result = {
      sessions: transformed,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    if (Object.keys(query).length === 0) {
      await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(transformed));
    }

    return transformed; // Return just the array for frontend compatibility
  }
};
