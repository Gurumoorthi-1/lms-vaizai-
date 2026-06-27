import express from 'express';
import {
  createAssignment,
  getAllAssignments,
  getAssignmentsByCourse,
  submitAssignment,
  getSubmissionsByAssignment,
  getMySubmission,
  evaluateSubmission,
  generateAIFeedback
} from '../controllers/assignment.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { secureUpload } from '../middleware/secureUpload.js';
import { validate } from '../validation/auth.validation.js';
import { createAssignmentSchema, evaluateSubmissionSchema, getSubmissionsSchema } from '../validation/assignment.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Assignments
 *   description: Assignment and submission management
 */

router.get('/', protect, getAllAssignments);
router.post('/', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), validate(createAssignmentSchema), createAssignment);
router.get('/course/:courseId', protect, getAssignmentsByCourse);

/**
 * @swagger
 * /api/assignments/{assignmentId}/submit:
 *   post:
 *     summary: Submit an assignment with file upload
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Successfully submitted
 */
router.post('/:assignmentId/submit', protect, authorize('STUDENT'), secureUpload('assignment', 'file', { optional: true }), submitAssignment);

router.get('/:assignmentId/my-submission', protect, authorize('STUDENT'), getMySubmission);
router.get('/:assignmentId/submissions', protect, getSubmissionsByAssignment);
router.put('/submissions/:submissionId/evaluate', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), validate(evaluateSubmissionSchema), evaluateSubmission);
router.post('/submissions/:submissionId/ai-feedback', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), generateAIFeedback);

export default router;
