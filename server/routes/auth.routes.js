import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
  getMe,
  updateSettings,
  updatePassword,
  getSessions,
  revokeSession,
  getApiKeys,
  generateApiKey,
  revokeApiKey,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, registerSchema, loginSchema, forgotPasswordSchema } from '../validation/auth.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication operations
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [STUDENT, INSTRUCTOR, ADMIN]
 *     responses:
 *       201:
 *         description: Successfully registered
 */
router.post('/register', validate(registerSchema), registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in
 */
router.post('/login', validate(loginSchema), loginUser);

router.post('/logout', protect, logoutUser);
router.post('/refresh-token', refreshToken);

// Forgot password flow
router.post('/forgot-password/send-otp', validate(forgotPasswordSchema), sendForgotPasswordOTP);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOTP);
router.post('/reset-password', resetPassword);

router.get('/me', protect, getMe);

// Settings routes
router.put('/settings', protect, updateSettings);
router.put('/password', protect, updatePassword);

// Active Sessions
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:id', protect, revokeSession);

// API Keys
router.get('/apikeys', protect, getApiKeys);
router.post('/apikeys', protect, generateApiKey);
router.delete('/apikeys/:id', protect, revokeApiKey);

export default router;
