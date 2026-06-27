import express from 'express';
import {
  getMyNotifications, markAsRead, markAllAsRead,
  deleteNotification, sendNotification, scheduleReminder
} from '../controllers/notification.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../validation/auth.validation.js';
import { sendNotificationSchema, scheduleReminderSchema, notificationQuerySchema } from '../validation/notification.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app, email and push notification management
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get my notifications (with unread count)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification list with unread count
 */
router.get('/', protect, validate(notificationQuerySchema), getMyNotifications);

router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);

// Admin-only: trigger or schedule notifications
router.post('/send', protect, authorize('ADMIN'), validate(sendNotificationSchema), sendNotification);
router.post('/schedule', protect, authorize('ADMIN'), validate(scheduleReminderSchema), scheduleReminder);

export default router;
