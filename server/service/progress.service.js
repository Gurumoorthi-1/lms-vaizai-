import { enrollmentRepository } from '../repository/enrollment.repository.js';
import redisClient from '../config/redis.js';

const CACHE_EXPIRATION = 3600; // 1 hour

export const progressService = {
  updateWatchTime: async (studentId, courseId, additionalSeconds) => {
    const enrollment = await enrollmentRepository.findByUserAndCourse(studentId, courseId);
    if (!enrollment) throw new Error('Enrollment not found');

    const newWatchTime = enrollment.watchTimeSeconds + additionalSeconds;
    
    // Streak logic
    const now = new Date();
    const lastActivity = enrollment.learningStreak?.lastActivityDate;
    let currentStreak = enrollment.learningStreak?.currentStreak || 0;
    let longestStreak = enrollment.learningStreak?.longestStreak || 0;

    if (lastActivity) {
      const diffHours = Math.abs(now - lastActivity) / 36e5;
      if (diffHours > 24 && diffHours < 48) {
        currentStreak += 1;
      } else if (diffHours >= 48) {
        currentStreak = 1; // Reset streak if missed a day
      }
    } else {
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    const updated = await enrollmentRepository.updateProgress(studentId, courseId, {
      watchTimeSeconds: newWatchTime,
      learningStreak: {
        currentStreak,
        longestStreak,
        lastActivityDate: now
      }
    });

    // Invalidate analytics cache
    await redisClient.del(`analytics:weekly:${studentId}`);

    return updated;
  },

  getAnalyticsReport: async (studentId) => {
    const cacheKey = `analytics:weekly:${studentId}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const report = await enrollmentRepository.getWeeklyReport(studentId);
    
    // Default response if no data
    const finalReport = report.length > 0 ? report[0] : { totalWatchTime: 0, averageProgress: 0, coursesActive: 0 };

    await redisClient.setEx(cacheKey, CACHE_EXPIRATION, JSON.stringify(finalReport));

    return finalReport;
  }
};
