import express from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../validation/auth.validation.js';
import { updateUserRoleSchema, updateUserStatusSchema, updateSettingSchema } from '../validation/admin.validation.js';

const router = express.Router();

// All routes here are restricted to Admin role
router.use(protect);
router.use(authorize('ADMIN'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Platform administration, user roles, system configs, and security logs
 */

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Update a user's RBAC role (Admin only)
 *     tags: [Admin]
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [STUDENT, INSTRUCTOR, TEACHER, ADMIN, TEACHING_ASSISTANT, MODERATOR]
 *     responses:
 *       200:
 *         description: User role updated successfully
 */
router.put('/users/:id/role', validate(updateUserRoleSchema), adminController.updateUserRole);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     summary: Suspend or activate a user account (Admin only)
 *     tags: [Admin]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, suspended]
 *     responses:
 *       200:
 *         description: Account status updated successfully
 */
router.put('/users/:id/status', validate(updateUserStatusSchema), adminController.updateUserStatus);

/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     summary: Get paginated platform audit logs (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Audit logs returned successfully
 */
router.get('/audit-logs', adminController.getAuditLogs);

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update or create a system config setting (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key, value]
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: object
 *     responses:
 *       200:
 *         description: Setting updated successfully
 */
router.put('/settings', validate(updateSettingSchema), adminController.updateSetting);

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Retrieve all system configuration settings (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of settings
 */
router.get('/settings', adminController.getAllSettings);

export default router;
