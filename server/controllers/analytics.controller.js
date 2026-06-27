import { analyticsService } from '../service/analytics.service.js';

export const analyticsController = {
  getOverview: async (req, res) => {
    try {
      const stats = await analyticsService.getOverviewStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  getTeacherPerformance: async (req, res) => {
    try {
      const stats = await analyticsService.getTeacherPerformance();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  getStudentGrowth: async (req, res) => {
    try {
      const interval = req.query.interval || 'monthly';
      const stats = await analyticsService.getStudentGrowth(interval);
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  getMostViewedCourses: async (req, res) => {
    try {
      const stats = await analyticsService.getMostViewedCourses();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  getWeeklyMonthlyReport: async (req, res) => {
    try {
      const type = req.query.type || 'revenue';
      const interval = req.query.interval || 'monthly';
      const stats = await analyticsService.getWeeklyMonthlyReport(type, interval);
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  clearCache: async (req, res) => {
    try {
      await analyticsService.clearAnalyticsCache();
      res.json({ message: 'Analytics cache cleared successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};
