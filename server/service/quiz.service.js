import { quizRepository } from '../repository/quiz.repository.js';
import { quizAttemptRepository } from '../repository/quizAttempt.repository.js';
import { enrollmentRepository } from '../repository/enrollment.repository.js';
import { assignmentRepository } from '../repository/assignment.repository.js';
import { submissionRepository } from '../repository/submission.repository.js';

export const quizService = {
  createQuiz: async (data, user) => {
    return await quizRepository.create({
      ...data,
      createdBy: user._id
    });
  },

  getQuizById: async (id) => {
    const quiz = await quizRepository.findById(id);
    if (!quiz) throw new Error('Quiz not found');
    return quiz;
  },

  getQuizzesByCourse: async (courseId, query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const quizzes = await quizRepository.findByCourse(courseId, limit, skip);
    const total = await quizRepository.countByCourse(courseId);

    return {
      quizzes,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  },

  updateQuiz: async (id, data, user) => {
    const quiz = await quizRepository.findById(id);
    if (!quiz) throw new Error('Quiz not found');

    // Only creator or admin can update
    if (quiz.createdBy.toString() !== user._id.toString() && user.role !== 'ADMIN') {
      throw new Error('Not authorized to update this quiz');
    }

    return await quizRepository.updateById(id, data);
  },

  deleteQuiz: async (id, user) => {
    const quiz = await quizRepository.findById(id);
    if (!quiz) throw new Error('Quiz not found');

    if (quiz.createdBy.toString() !== user._id.toString() && user.role !== 'ADMIN') {
      throw new Error('Not authorized to delete this quiz');
    }

    return await quizRepository.deleteById(id);
  },

  submitAttempt: async (quizId, submissionData, user) => {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new Error('Quiz not found');

    // Verify enrollment
    const enrollment = await enrollmentRepository.findByUserAndCourse(user._id, quiz.courseId);
    if (!enrollment) {
      throw new Error('You must be enrolled in the course to attempt this quiz');
    }

    // Check attempts limit
    if (quiz.maxAttempts > 0) {
      const attemptsCount = await quizAttemptRepository.countAttempts(user._id, quizId);
      if (attemptsCount >= quiz.maxAttempts) {
        throw new Error(`You have reached the maximum attempt limit of ${quiz.maxAttempts} for this quiz`);
      }
    }

    let totalPointsPossible = 0;
    let totalPointsEarned = 0;
    const gradedAnswers = [];

    for (const question of quiz.questions) {
      totalPointsPossible += question.points || 1;

      const studentAnswer = submissionData.answers.find(
        ans => ans.questionId.toString() === question._id.toString()
      );

      let isCorrect = false;
      let pointsEarned = 0;
      let selectedOption = null;
      let answerText = '';

      if (studentAnswer) {
        selectedOption = studentAnswer.selectedOption;
        answerText = studentAnswer.answerText || '';

        if (question.type === 'mcq' || question.type === 'true_false') {
          if (selectedOption === question.correctOption) {
            isCorrect = true;
            pointsEarned = question.points || 1;
          }
        }
        // Text questions are not autograded here (default is false, manual review or 0 points)
      }

      totalPointsEarned += pointsEarned;
      gradedAnswers.push({
        questionId: question._id,
        selectedOption,
        answerText,
        isCorrect,
        pointsEarned
      });
    }

    const scorePercentage = totalPointsPossible > 0 
      ? Math.round((totalPointsEarned / totalPointsPossible) * 100) 
      : 0;

    const passed = scorePercentage >= quiz.passingScore;

    // Save attempt
    const attempt = await quizAttemptRepository.create({
      userId: user._id,
      quizId,
      answers: gradedAnswers,
      score: scorePercentage,
      passed
    });

    // Update Student Enrollment Quiz score
    await enrollmentRepository.updateQuizScore(user._id, quiz.courseId, quizId, totalPointsEarned, totalPointsPossible);

    // Auto-compute and update overall course progress
    try {
      const [totalQuizzes, totalAssignments, allAttempts, allSubmissions] = await Promise.all([
        quizRepository.countByCourse(quiz.courseId),
        assignmentRepository.countByCourse ? assignmentRepository.countByCourse(quiz.courseId) : 0,
        quizAttemptRepository.countAttemptedQuizzes ? quizAttemptRepository.countAttemptedQuizzes(user._id, quiz.courseId) : 0,
        submissionRepository.countByStudentAndCourse ? submissionRepository.countByStudentAndCourse(user._id, quiz.courseId) : 0
      ]);
      const totalItems = (totalQuizzes || 0) + (totalAssignments || 0);
      const completedItems = (allAttempts || 0) + (allSubmissions || 0);
      const newProgress = totalItems > 0 ? Math.min(100, Math.round((completedItems / totalItems) * 100)) : 0;
      await enrollmentRepository.updateProgress(user._id, quiz.courseId, { progress: newProgress });
    } catch (progressErr) {
      console.warn('[QuizService] Could not update progress:', progressErr.message);
    }

    return {
      attempt,
      correctCount: gradedAnswers.filter(a => a.isCorrect).length,
      totalQuestions: quiz.questions.length,
      score: scorePercentage,
      passed,
      feedback: quiz.questions.map(q => {
        const studentAns = gradedAnswers.find(a => a.questionId.toString() === q._id.toString());
        return {
          questionId: q._id,
          text: q.text,
          type: q.type,
          correctOption: q.correctOption,
          studentSelected: studentAns ? studentAns.selectedOption : null,
          isCorrect: studentAns ? studentAns.isCorrect : false,
          explanation: q.explanation || ''
        };
      })
    };
  },

  getAttempts: async (quizId, user) => {
    return await quizAttemptRepository.findByUserAndQuiz(user._id, quizId);
  }
};
