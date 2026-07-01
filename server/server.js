import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import { createServer } from 'http';
import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js';
import { setupSwagger } from './config/swagger.js';
import { initSocket } from './config/socket.js';
import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import aiRoutes from './routes/ai.routes.js';
import studentRoutes from './routes/student.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import progressRoutes from './routes/progress.routes.js';
import liveSessionRoutes from './routes/liveSession.routes.js';
import forumRoutes from './routes/forum.routes.js';
import certificateRoutes from './routes/certificate.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import uploadRoutes from './routes/upload.routes.js';

// Start notification background worker inline (or run separately: node workers/notification.worker.js)
import './workers/notification.worker.js';

import User from './models/User.js';

dotenv.config();

// Ensure secure upload directories exist at startup
['secure-uploads', 'secure-uploads/assignments', 'secure-uploads/images', 'secure-uploads/videos', 'secure-uploads/pdfs'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Seed/fix roles for hardcoded users on startup
const seedRoles = async () => {
  try {
    const adminUser = await User.findOne({ email: 'admin@gmail.com' });
    if (adminUser && adminUser.role !== 'ADMIN') {
      adminUser.role = 'ADMIN';
      await User.findByIdAndUpdate(adminUser._id, { role: 'ADMIN' });
      console.log('[seed] Fixed admin@gmail.com role → ADMIN');
    }

    const teacherUser = await User.findOne({ email: 'teacher@gmail.com' });
    if (teacherUser && teacherUser.role !== 'TEACHER') {
      teacherUser.role = 'TEACHER';
      await User.findByIdAndUpdate(teacherUser._id, { role: 'TEACHER' });
      console.log('[seed] Fixed teacher@gmail.com role → TEACHER');
    }
  } catch (err) {
    console.error('[seed] Role fix error:', err.message);
  }
};

connectDB().then(() => seedRoles());
connectRedis();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io on the HTTP server
initSocket(httpServer);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://lms-vaizai.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Mobile apps, Postman, curl etc.
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowedOrigins or vercel patterns
    const isAllowed = allowedOrigins.includes(origin) || 
                      /^https:\/\/lms-vaizai(-[a-z0-9]+)?\.vercel\.app$/.test(origin);
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Enable pre-flight request handling for all routes via middleware instead of app.options('*')
app.options('(.*)', cors());

app.use(express.json());

// Expose uploads directory statically so files can be downloaded
app.use('/uploads', express.static('uploads'));

setupSwagger(app);

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/live-sessions', liveSessionRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploads', uploadRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running...' });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
