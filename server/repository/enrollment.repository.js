import mongoose from 'mongoose';
import Enrollment from '../models/Enrollment.js';

export const enrollmentRepository = {
  create: async (data) => {
    return await Enrollment.create(data);
  },

  findByUserAndCourse: async (studentId, courseId) => {
    return await Enrollment.findOne({ studentId, courseId });
  },

  findByUser: async (studentId, limit = 10, skip = 0) => {
    return await Enrollment.find({ studentId }).populate('courseId', 'title thumbnail category duration').skip(skip).limit(limit);
  },

  findByUserIds: async (studentIds) => {
    return await Enrollment.find({ studentId: { $in: studentIds } });
  },

  delete: async (studentId, courseId) => {
    return await Enrollment.findOneAndDelete({ studentId, courseId });
  },

  updateProgress: async (studentId, courseId, progressData) => {
    return await Enrollment.findOneAndUpdate(
      { studentId, courseId },
      { $set: progressData },
      { new: true }
    );
  },

  getWeeklyReport: async (studentId) => {
    // Basic aggregation: could be expanded based on activity logs
    // For MVP, we aggregate total watch time and active courses
    return await Enrollment.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      { $group: {
        _id: null,
        totalWatchTime: { $sum: "$watchTimeSeconds" },
        averageProgress: { $avg: "$progress" },
        coursesActive: { $sum: 1 }
      }}
    ]);
  },

  updateQuizScore: async (studentId, courseId, quizId, score, maxScore) => {
    const enrollment = await Enrollment.findOne({ studentId, courseId });
    if (!enrollment) return null;

    const existingScoreIdx = enrollment.quizScores.findIndex(
      q => q.quizId && q.quizId.toString() === quizId.toString()
    );
    if (existingScoreIdx > -1) {
      if (score > enrollment.quizScores[existingScoreIdx].score) {
        enrollment.quizScores[existingScoreIdx].score = score;
        enrollment.quizScores[existingScoreIdx].maxScore = maxScore;
      }
    } else {
      enrollment.quizScores.push({ quizId, score, maxScore });
    }
    return await enrollment.save();
  }
};

