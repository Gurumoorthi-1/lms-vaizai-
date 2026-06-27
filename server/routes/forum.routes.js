import express from 'express';
import {
  createQuestion, getQuestions, getPostById, createReply,
  toggleLike, toggleBookmark, getMyBookmarks,
  reportPost, deletePost, pinPost, markResolved,
  getFlaggedPosts, clearFlag,
  createCategory, getCategories
} from '../controllers/forum.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../validation/auth.validation.js';
import { createQuestionSchema, createReplySchema, reportPostSchema, createCategorySchema, forumQuerySchema } from '../validation/forum.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Forum
 *   description: Discussion forum - questions, answers, nested replies
 */

// ─── Categories ────────────────────────────────────────────────────────────────
router.get('/categories', getCategories);
router.post('/categories', protect, authorize('ADMIN', 'MODERATOR'), validate(createCategorySchema), createCategory);

// ─── Moderation (admin/moderator only) ────────────────────────────────────────
router.get('/moderation/flagged', protect, authorize('ADMIN', 'MODERATOR'), getFlaggedPosts);
router.put('/moderation/:id/clear-flag', protect, authorize('ADMIN', 'MODERATOR'), clearFlag);
router.put('/moderation/:id/pin', protect, authorize('ADMIN', 'MODERATOR', 'INSTRUCTOR'), pinPost);

// ─── My bookmarks ──────────────────────────────────────────────────────────────
router.get('/bookmarks/me', protect, getMyBookmarks);

/**
 * @swagger
 * /api/forum:
 *   get:
 *     summary: Get all forum questions with pagination, filtering and search
 *     tags: [Forum]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, likes, viewCount, answerCount]
 *     responses:
 *       200:
 *         description: List of questions
 */
router.get('/', validate(forumQuerySchema), getQuestions);

/**
 * @swagger
 * /api/forum:
 *   post:
 *     summary: Create a new question
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, body]
 *             properties:
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Question created
 */
router.post('/', protect, validate(createQuestionSchema), createQuestion);

router.get('/:id', getPostById);
router.delete('/:id', protect, deletePost);
router.put('/:id/resolve', protect, markResolved);

// ─── Replies (answers and nested) ─────────────────────────────────────────────
router.post('/:id/reply', protect, validate(createReplySchema), createReply);

// ─── Interactions ──────────────────────────────────────────────────────────────
router.post('/:id/like', protect, toggleLike);
router.post('/:id/bookmark', protect, toggleBookmark);
router.post('/:id/report', protect, validate(reportPostSchema), reportPost);

export default router;
