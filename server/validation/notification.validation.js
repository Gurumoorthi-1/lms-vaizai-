import { z } from 'zod';

export const sendNotificationSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    type: z.enum([
      'course_published', 'assignment_due', 'assignment_graded',
      'quiz_available', 'enrollment_confirmed', 'certificate_issued',
      'session_starting', 'forum_reply', 'achievement_unlocked',
      'reminder', 'system'
    ]),
    title: z.string().min(1),
    message: z.string().min(1),
    link: z.string().url().optional(),
    channels: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      inApp: z.boolean().optional()
    }).optional(),
    scheduledFor: z.string().datetime().optional()
  })
});

export const scheduleReminderSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    title: z.string().min(1),
    message: z.string().min(1),
    link: z.string().url().optional(),
    scheduledFor: z.string().datetime('Must be a valid ISO datetime')
  })
});

export const notificationQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    isRead: z.enum(['true', 'false']).optional()
  })
});
