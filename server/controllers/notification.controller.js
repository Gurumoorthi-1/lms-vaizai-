import { notificationService } from '../service/notification.service.js';

export const getMyNotifications = async (req, res) => {
  try {
    const result = await notificationService.getMyNotifications(req.user._id, req.query);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const markAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAsRead(req.params.id, req.user._id);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    res.json({ message: 'All notifications marked as read', ...result });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const deleteNotification = async (req, res) => {
  try {
    const result = await notificationService.deleteNotification(req.params.id, req.user._id);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

// Admin-only: manually trigger a notification
export const sendNotification = async (req, res) => {
  try {
    const result = await notificationService.notify(req.body);
    res.status(201).json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

// Admin-only: schedule a reminder
export const scheduleReminder = async (req, res) => {
  try {
    const result = await notificationService.scheduleReminder(req.body);
    res.status(201).json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};
