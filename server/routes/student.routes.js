import express from 'express';
import {
  getAllStudents,
  getStudentProfile,
  enrollInCourse,
  dropCourse,
  updateProgress,
  getLearningHistory,
  addBookmark,
  removeBookmark,
  addWishlist,
  removeWishlist
} from '../controllers/student.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../validation/auth.validation.js';
import { updateProgressSchema, courseIdParamSchema, querySchema } from '../validation/student.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student management and interactions
 */

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Get all students (Admin/Instructor)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), validate(querySchema), getAllStudents);

// ─── Student-specific routes (must be before /:id to avoid route shadowing) ───
router.get('/me/history', protect, getLearningHistory);

router.post('/enroll/:courseId', protect, validate(courseIdParamSchema), enrollInCourse);
router.delete('/enroll/:courseId', protect, validate(courseIdParamSchema), dropCourse);
router.put('/progress/:courseId', protect, validate(updateProgressSchema), updateProgress);

router.post('/bookmarks/:courseId', protect, validate(courseIdParamSchema), addBookmark);
router.delete('/bookmarks/:courseId', protect, validate(courseIdParamSchema), removeBookmark);

router.post('/wishlist/:courseId', protect, validate(courseIdParamSchema), addWishlist);
router.delete('/wishlist/:courseId', protect, validate(courseIdParamSchema), removeWishlist);

// ─── Profile by ID ────────────────────────────────────────────────────────────
// STUDENTs can fetch their own profile; ADMIN/INSTRUCTOR/TEACHER can fetch any.
router.get('/:id', protect, getStudentProfile);

export default router;
