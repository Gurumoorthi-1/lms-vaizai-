import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket auth middleware — verifies JWT on every socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    console.log('[Socket] Auth middleware called, token:', !!token);
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[Socket] Token decoded:', decoded);
      socket.user = decoded;
      next();
    } catch (err) {
      console.error('[Socket] Invalid token:', err.message);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User ${socket.user?.id || 'unknown'} connected`);

    // User joins their own room for personal notifications
    socket.join(`user:${socket.user?.id}`);

    socket.on('join:session', (sessionId) => {
      socket.join(`session:${sessionId}`);
      io.to(`session:${sessionId}`).emit('user:joined', {
        userId: socket.user?.id,
        sessionId
      });
    });

    socket.on('leave:session', (sessionId) => {
      socket.leave(`session:${sessionId}`);
      io.to(`session:${sessionId}`).emit('user:left', {
        userId: socket.user?.id,
        sessionId
      });
    });

    // Join a course room for real-time updates
    socket.on('join:course', (courseId) => {
      console.log(`[Socket] User ${socket.user?.id} joining course: ${courseId}`);
      socket.join(`course:${courseId}`);
    });

    socket.on('leave:course', (courseId) => {
      socket.leave(`course:${courseId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User ${socket.user?.id || 'unknown'} disconnected`);
    });
  });

  return io;
};

// Helper used by services to emit events without importing the full io instance
export const getIO = () => {
  if (!io) {
    console.warn('[Socket] getIO called before initialization');
    return null;
  }
  return io;
};
