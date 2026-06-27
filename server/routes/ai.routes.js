import express from 'express';
import {
  generateSummary,
  generateQuiz,
  generateFlashcards,
  generateInterviewQuestions,
  generateAssignment,
  generateRoadmap,
  generateChat,
  getHistory,
  getUsageStats,
  invalidateCacheByAction,
  flushAllCache,
  getServiceConfig
} from '../controllers/ai.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../validation/auth.validation.js';
import {
  summarySchema,
  quizSchema,
  flashcardSchema,
  interviewSchema,
  assignmentSchema,
  roadmapSchema,
  chatSchema
} from '../validation/ai.validation.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply auth + rate limiting to all AI routes
router.use(protect);
router.use(aiRateLimiter);

/**
 * @swagger
 * tags:
 *   name: AI Content
 *   description: AI Content Generation, History & Cache Management APIs
 */

// ─── Content Generation ────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ai/summary:
 *   post:
 *     summary: Generate a content summary (supports ?stream=true for SSE)
 *     tags: [AI Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: stream
 *         schema: { type: boolean }
 *         description: Set to true for Server-Sent Events streaming
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, description: The text to summarize }
 *     responses:
 *       200: { description: Summary generated }
 *       422: { description: AI response validation failed }
 *       503: { description: AI service unavailable }
 */
router.post('/summary',    validate(summarySchema),   generateSummary);

/**
 * @swagger
 * /api/ai/quiz:
 *   post:
 *     summary: Generate a multiple-choice quiz (supports ?stream=true for SSE)
 *     tags: [AI Content]
 *     security:
 *       - bearerAuth: []
 */
router.post('/quiz',       validate(quizSchema),       generateQuiz);

/**
 * @swagger
 * /api/ai/flashcards:
 *   post:
 *     summary: Generate flashcards (supports ?stream=true for SSE)
 *     tags: [AI Content]
 *     security:
 *       - bearerAuth: []
 */
router.post('/flashcards', validate(flashcardSchema),  generateFlashcards);

/**
 * @swagger
 * /api/ai/interview:
 *   post:
 *     summary: Generate interview questions (supports ?stream=true for SSE)
 *     tags: [AI Content]
 *     security:
 *       - bearerAuth: []
 */
router.post('/interview',  validate(interviewSchema),  generateInterviewQuestions);

/**
 * @swagger
 * /api/ai/assignment:
 *   post:
 *     summary: Generate an assignment (supports ?stream=true for SSE)
 *     tags: [AI Content]
 *     security:
 *       - bearerAuth: []
 */
router.post('/assignment', validate(assignmentSchema), generateAssignment);

/**
 * @swagger
 * /api/ai/roadmap:
 *   post:
 *     summary: Generate a learning roadmap (supports ?stream=true for SSE)
 *     tags: [AI Content]
 *     security:
 *       - bearerAuth: []
 */
router.post('/roadmap',    validate(roadmapSchema),    generateRoadmap);
router.post('/chat',       validate(chatSchema),       generateChat);

// ─── History & Usage ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ai/history:
 *   get:
 *     summary: Retrieve authenticated user's prompt history
 *     tags: [AI Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 */
router.get('/history', getHistory);

/**
 * @swagger
 * /api/ai/usage:
 *   get:
 *     summary: Get aggregated token usage and cost statistics for the authenticated user
 *     tags: [AI Content]
 *     security:
 *       - bearerAuth: []
 */
router.get('/usage', getUsageStats);

// ─── Service Metadata ──────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ai/config:
 *   get:
 *     summary: Return AI service configuration (model, limits, costs) — Admin only
 *     tags: [AI Content]
 *     security:
 *       - bearerAuth: []
 */
router.get('/config', authorize('admin'), getServiceConfig);

// ─── Cache Management (Admin only) ────────────────────────────────────────

/**
 * @swagger
 * /api/ai/cache/{actionType}:
 *   delete:
 *     summary: Invalidate Redis cache for a specific AI action type — Admin only
 *     tags: [AI Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: actionType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Summary, Quiz, Flashcards, InterviewQuestions, Assignment, Roadmap]
 */
router.delete('/cache/:actionType', authorize('admin'), invalidateCacheByAction);

/**
 * @swagger
 * /api/ai/cache:
 *   delete:
 *     summary: Flush entire AI response cache — Admin only
 *     tags: [AI Content]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/cache', authorize('admin'), flushAllCache);

export default router;
