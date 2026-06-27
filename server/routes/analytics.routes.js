import express from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: System and Course Performance Analytics
 */

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Retrieve dashboard overview statistics (Admin/Instructor only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview stats returned successfully
 */
router.get('/overview', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), analyticsController.getOverview);

/**
 * @swagger
 * /api/analytics/teachers:
 *   get:
 *     summary: Retrieve teacher performance metrics (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance list
 */
router.get('/teachers', protect, authorize('ADMIN'), analyticsController.getTeacherPerformance);

/**
 * @swagger
 * /api/analytics/growth:
 *   get:
 *     summary: Retrieve student growth metrics (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [weekly, monthly]
 *         description: Time group interval
 *     responses:
 *       200:
 *         description: Growth numbers
 */
router.get('/growth', protect, authorize('ADMIN'), analyticsController.getStudentGrowth);

/**
 * @swagger
 * /api/analytics/most-viewed:
 *   get:
 *     summary: Retrieve list of top-performing courses (Admin/Instructor only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of top courses
 */
router.get('/most-viewed', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), analyticsController.getMostViewedCourses);

/**
 * @swagger
 * /api/analytics/reports:
 *   get:
 *     summary: Get weekly/monthly timelines for revenue or enrollments
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [revenue, enrollment]
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [weekly, monthly]
 *     responses:
 *       200:
 *         description: Chart data points
 */
router.get('/reports', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), analyticsController.getWeeklyMonthlyReport);

/**
 * @swagger
 * /api/analytics/clear-cache:
 *   post:
 *     summary: Clear all cached analytics data (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared
 */
router.post('/clear-cache', protect, authorize('ADMIN'), analyticsController.clearCache);

export default router;
