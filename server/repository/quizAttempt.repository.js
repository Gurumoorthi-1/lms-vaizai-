import QuizAttempt from '../models/QuizAttempt.js';

export const quizAttemptRepository = {
  create: async (data) => {
    return await QuizAttempt.create(data);
  },

  findById: async (id) => {
    return await QuizAttempt.findById(id).populate('quizId', 'title passingScore');
  },

  findByUserAndQuiz: async (userId, quizId) => {
    return await QuizAttempt.find({ userId, quizId }).sort({ completedAt: -1 });
  },

  countAttempts: async (userId, quizId) => {
    return await QuizAttempt.countDocuments({ userId, quizId });
  },

  getBestAttempt: async (userId, quizId) => {
    return await QuizAttempt.findOne({ userId, quizId }).sort({ score: -1 });
  },

  countAttemptedQuizzes: async (userId, courseId) => {
    // Count distinct quizzes a user has attempted in a course
    const results = await QuizAttempt.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$quizId' } },
      { $count: 'count' }
    ]);
    // Note: We rely on caller to pass quizIds in courseId scope via quiz.service logic
    return results[0]?.count || 0;
  }
};
