import express from 'express';
import {
  updateWatchTime,
  getAnalyticsReport
} from '../controllers/progress.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Progress & Analytics
 *   description: Student progress and analytics APIs
 */

router.put('/:courseId/watch-time', protect, authorize('STUDENT'), updateWatchTime);
router.get('/analytics/weekly', protect, authorize('STUDENT'), getAnalyticsReport);

export default router;
