import { quizService } from '../service/quiz.service.js';

export const quizController = {
  createQuiz: async (req, res) => {
    try {
      const quiz = await quizService.createQuiz(req.body, req.user);
      res.status(201).json({ message: 'Quiz created successfully', quiz });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  getQuiz: async (req, res) => {
    try {
      const quiz = await quizService.getQuizById(req.params.id);
      res.json(quiz);
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  },

  getCourseQuizzes: async (req, res) => {
    try {
      const result = await quizService.getQuizzesByCourse(req.params.courseId, req.query);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  updateQuiz: async (req, res) => {
    try {
      const quiz = await quizService.updateQuiz(req.params.id, req.body, req.user);
      res.json({ message: 'Quiz updated successfully', quiz });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  deleteQuiz: async (req, res) => {
    try {
      await quizService.deleteQuiz(req.params.id, req.user);
      res.json({ message: 'Quiz deleted successfully' });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  submitAttempt: async (req, res) => {
    try {
      const result = await quizService.submitAttempt(req.params.id, req.body, req.user);
      res.json({ message: 'Quiz submitted successfully', ...result });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  getAttempts: async (req, res) => {
    try {
      const attempts = await quizService.getAttempts(req.params.id, req.user);
      res.json(attempts);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
};
