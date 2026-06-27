import express from 'express';
import { quizController } from '../controllers/quiz.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../validation/auth.validation.js';
import { createQuizSchema, updateQuizSchema, submitQuizSchema } from '../validation/quiz.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Quizzes
 *   description: Course and Lesson Quiz Management
 */

/**
 * @swagger
 * /api/quizzes:
 *   post:
 *     summary: Create a new quiz (Instructor/Admin only)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, courseId, questions]
 *             properties:
 *               title:
 *                 type: string
 *               courseId:
 *                 type: string
 *               lessonId:
 *                 type: string
 *               passingScore:
 *                 type: number
 *                 default: 70
 *               durationMinutes:
 *                 type: number
 *                 default: 0
 *               maxAttempts:
 *                 type: number
 *                 default: 0
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [type, text]
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [mcq, true_false, text]
 *                     text:
 *                       type: string
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                     correctOption:
 *                       type: number
 *                     points:
 *                       type: number
 *                     explanation:
 *                       type: string
 *     responses:
 *       201:
 *         description: Quiz created successfully
 */
router.post('/', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), validate(createQuizSchema), quizController.createQuiz);

/**
 * @swagger
 * /api/quizzes/course/{courseId}:
 *   get:
 *     summary: Get all quizzes for a specific course
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of quizzes
 */
router.get('/course/:courseId', protect, quizController.getCourseQuizzes);

/**
 * @swagger
 * /api/quizzes/{id}:
 *   get:
 *     summary: Get quiz by ID
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz details
 */
router.get('/:id', protect, quizController.getQuiz);

/**
 * @swagger
 * /api/quizzes/{id}:
 *   put:
 *     summary: Update an existing quiz
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz updated
 */
router.put('/:id', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), validate(updateQuizSchema), quizController.updateQuiz);

/**
 * @swagger
 * /api/quizzes/{id}:
 *   delete:
 *     summary: Delete a quiz
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz deleted
 */
router.delete('/:id', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), quizController.deleteQuiz);

/**
 * @swagger
 * /api/quizzes/{id}/submit:
 *   post:
 *     summary: Submit a quiz attempt
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [answers]
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [questionId]
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     selectedOption:
 *                       type: number
 *                     answerText:
 *                       type: string
 *     responses:
 *       200:
 *         description: Quiz auto-graded results
 */
router.post('/:id/submit', protect, validate(submitQuizSchema), quizController.submitAttempt);

/**
 * @swagger
 * /api/quizzes/{id}/attempts:
 *   get:
 *     summary: Get all attempts for a quiz by the current student
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of attempts
 */
router.get('/:id/attempts', protect, quizController.getAttempts);

export default router;
