import express from 'express';
import {
  createCourse,
  getCourseById,
  getAllCourses,
  updateCourse,
  deleteCourse,
  publishCourse,
  archiveCourse,
  createVersion
} from '../controllers/course.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../validation/auth.validation.js';
import { createCourseSchema, updateCourseSchema } from '../validation/course.validation.js';


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management APIs
 */

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses with pagination, filtering, and search
 *     tags: [Courses]
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
 *         description: List of courses
 */
router.get('/', getAllCourses);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course created
 */
router.post('/', protect, authorize('INSTRUCTOR', 'TEACHER', 'ADMIN'), validate(createCourseSchema), createCourse);

router.get('/:id', getCourseById);
router.put('/:id', protect, authorize('INSTRUCTOR', 'TEACHER', 'ADMIN'), validate(updateCourseSchema), updateCourse);
router.delete('/:id', protect, authorize('INSTRUCTOR', 'TEACHER', 'ADMIN'), deleteCourse);

router.post('/:id/publish', protect, authorize('INSTRUCTOR', 'TEACHER', 'ADMIN'), publishCourse);
router.post('/:id/archive', protect, authorize('INSTRUCTOR', 'TEACHER', 'ADMIN'), archiveCourse);
router.post('/:id/version', protect, authorize('INSTRUCTOR', 'TEACHER', 'ADMIN'), createVersion);

export default router;
