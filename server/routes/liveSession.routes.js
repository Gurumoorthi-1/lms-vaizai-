import express from 'express';
import {
  createSession, getSessionById, getSessionsByCourse,
  getUpcomingSessions, startSession, endSession,
  joinSession, leaveSession, updateSession, cancelSession, markAttendance,
  uploadTranscript, updateRecordingMetadata,
  getAttendance, getMyAttendance, getAllSessions
} from '../controllers/liveSession.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../validation/auth.validation.js';
import { createSessionSchema, updateSessionSchema, uploadTranscriptSchema } from '../validation/liveSession.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Live Sessions
 *   description: Live class session management
 */

/**
 * @swagger
 * /api/live-sessions:
 *   post:
 *     summary: Create a live class session (Instructor/Admin only)
 *     tags: [Live Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, title, scheduledAt]
 *             properties:
 *               courseId:
 *                 type: string
 *               title:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               durationMinutes:
 *                 type: integer
 *               meetingUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Session created
 */
router.get('/', protect, getAllSessions);
router.post('/', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), validate(createSessionSchema), createSession);

router.get('/course/:courseId', protect, getSessionsByCourse);
router.get('/course/:courseId/upcoming', protect, getUpcomingSessions);
router.get('/attendance/me', protect, getMyAttendance);
router.get('/:id', protect, getSessionById);

router.put('/:id', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), validate(updateSessionSchema), updateSession);
router.post('/:id/cancel', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), cancelSession);
router.delete('/:id', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), async (req, res) => {
  try {
    const { liveSessionRepository } = await import('../repository/liveSession.repository.js');
    await liveSessionRepository.deleteById(req.params.id);
    res.json({ message: 'Session deleted' });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// Session Lifecycle
router.post('/:id/start', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), startSession);
router.post('/:id/end', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), endSession);
router.post('/:id/join', protect, joinSession);
router.post('/:id/leave', protect, leaveSession);
router.post('/:id/attendance', protect, markAttendance);

// Content & Metadata
router.post('/:id/transcript', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), validate(uploadTranscriptSchema), uploadTranscript);
router.put('/:id/recording', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), updateRecordingMetadata);

// Attendance
router.get('/:id/attendance', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), getAttendance);

export default router;
