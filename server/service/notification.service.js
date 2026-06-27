import nodemailer from 'nodemailer';
import { notificationRepository } from '../repository/notification.repository.js';
import { userRepository } from '../repository/user.repository.js';
import { getNotificationQueue, getScheduledNotificationQueue, areQueuesActive, NOTIFICATION_JOBS } from '../config/queue.js';
import { getIO } from '../config/socket.js';

// Lazy transporter creation — ensures env vars are available at call time
let _transporter = null;
const getTransporter = () => {
  if (!_transporter) {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error(`SMTP not configured. SMTP_HOST=${host}, SMTP_USER=${user ? 'set' : 'missing'}, SMTP_PASS=${pass ? 'set' : 'missing'}`);
    }

    _transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });

    console.log(`[Email] Transporter created: ${host}:${process.env.SMTP_PORT || 587} user=${user}`);
  }
  return _transporter;
};

// Keep backward-compat alias used in workers
const createTransporter = () => getTransporter();

/**
 * Core dispatch function — called by the Bull worker processor.
 * Direct senders are exported for use inside the worker only.
 */
export const sendEmail = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  const from = process.env.SMTP_USER
    ? `"Vaizai LMS" <${process.env.SMTP_USER}>`
    : `"Vaizai LMS" <noreply@vaizai.com>`;

  console.log(`[Email] Sending to=${to}, subject="${subject}", from=${from}`);

  try {
    const result = await transporter.sendMail({ from, to, subject, html });
    console.log(`[Email] ✅ Delivered to ${to}. MessageId: ${result.messageId}`);
    return result;
  } catch (err) {
    // Invalidate transporter cache so next call gets fresh config
    _transporter = null;
    console.error(`[Email] ❌ Failed to send to ${to}:`, err.message);
    throw err;
  }
};


/**
 * Primary service used by all other modules to trigger notifications.
 * Enqueues jobs into Bull — never blocks the request thread.
 */
export const notificationService = {
  /**
   * notify() — The single public interface used by all other services.
   * Auto-saves in-app record and enqueues email/push jobs.
   */
  notify: async ({ userId, type, title, message, link, channels = {}, metadata = {}, scheduledFor = null }) => {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error(`User ${userId} not found for notification`);

    const notifChannels = {
      inApp: channels.inApp !== false,  // Default ON
      email: !!channels.email,
      push: !!channels.push
    };

    // 1. Persist in-app notification to MongoDB
    const notification = await notificationRepository.create({
      userId,
      type,
      title,
      message,
      link,
      channels: notifChannels,
      metadata
    });

    // 2. Enqueue jobs only if queues are active
    if (areQueuesActive()) {
      const queue = scheduledFor ? getScheduledNotificationQueue() : getNotificationQueue();
      const delay = scheduledFor ? Math.max(0, new Date(scheduledFor) - Date.now()) : 0;

      // Enqueue email if requested
      if (notifChannels.email && user.email) {
        try {
          await queue.add(NOTIFICATION_JOBS.SEND_EMAIL, {
            to: user.email,
            subject: title,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">
              <h2 style="color:#1a1a2e">${title}</h2>
              <p>${message}</p>
              ${link ? `<a href="${link}" style="background:#c9a84c;color:white;padding:10px 20px;text-decoration:none;border-radius:5px">View Details</a>` : ''}
              <hr style="margin-top:30px"/>
              <small style="color:#999">Vaizai LMS — You received this because you are enrolled.</small>
            </div>`
          }, { delay, priority: 1 });
        } catch (error) {
          console.log('[Notification] Failed to queue email:', error.message);
        }
      }


    }

    // 3. Emit real-time socket event to the user
    try {
      const io = getIO();
      if (io) {
        // Join user to their own room if not already joined
        io.to(`user:${userId}`).emit('notification:new', notification);
      }
    } catch (err) {
      console.error('[Socket] Error emitting notification:new event:', err);
    }

    return notification;
  },

  /**
   * Broadcast to multiple users (e.g. course enrollment announcement)
   */
  broadcast: async (userIds, payload) => {
    return await Promise.allSettled(
      userIds.map(userId => notificationService.notify({ ...payload, userId }))
    );
  },

  /**
   * Schedule a reminder notification
   */
  scheduleReminder: async ({ userId, type, title, message, link, scheduledFor, metadata = {} }) => {
    return await notificationService.notify({
      userId, type: type || 'reminder', title, message, link,
      channels: { inApp: true, email: true },
      metadata,
      scheduledFor
    });
  },

  getMyNotifications: async (userId, query = {}) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const isRead = query.isRead === 'true' ? true : query.isRead === 'false' ? false : undefined;

    const notifications = await notificationRepository.findByUser(userId, { isRead, limit, skip });
    const total = await notificationRepository.countByUser(userId);
    const unreadCount = await notificationRepository.countByUser(userId, { isRead: false });

    return { notifications, unreadCount, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  markAsRead: async (notificationId, userId) => {
    const result = await notificationRepository.markAsRead(notificationId, userId);
    if (!result) throw new Error('Notification not found');
    return result;
  },

  markAllAsRead: async (userId) => {
    return await notificationRepository.markAllAsRead(userId);
  },

  deleteNotification: async (id, userId) => {
    const result = await notificationRepository.deleteById(id, userId);
    if (!result) throw new Error('Notification not found');
    return { message: 'Notification deleted' };
  }
};
