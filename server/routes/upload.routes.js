import express from 'express';
import {
  uploadFile,
  getFile,
  getSignedUrl,
  deleteFile
} from '../controllers/upload.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { secureUpload } from '../middleware/secureUpload.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: File Uploads
 *   description: Secure file upload, retrieval, and management APIs
 */

// ─── Upload ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/uploads/upload:
 *   post:
 *     summary: Upload a file securely with full validation pipeline
 *     tags: [File Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [image, video, pdf, assignment]
 *         default: assignment
 *         description: |
 *           Category of the file being uploaded. Determines:
 *           - Allowed extensions and MIME types
 *           - Maximum file size
 *           - Storage subdirectory
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded and stored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 file:
 *                   type: object
 *                   properties:
 *                     key:          { type: string }
 *                     url:          { type: string }
 *                     originalName: { type: string }
 *                     size:         { type: integer }
 *                     mimeType:     { type: string }
 *                     category:     { type: string }
 *       400: { description: Validation failure (extension, MIME, magic numbers, or virus) }
 *       413: { description: File exceeds size limit }
 *       415: { description: Unsupported media type }
 */
router.post(
  '/upload',
  protect,
  (req, res, next) => {
    // Resolve category early so secureUpload can use the correct config
    const category = req.query.category || 'assignment';
    secureUpload(category, 'file')(req, res, next);
  },
  uploadFile
);

// ─── Retrieve ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/uploads/{fileKey}:
 *   get:
 *     summary: Securely stream a stored file through the API server
 *     description: |
 *       Pipes the file through the server with security headers applied.
 *       Use this for local storage or when you need server-side access control.
 *       For cloud storage, prefer /signed-url for better performance.
 *     tags: [File Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileKey
 *         required: true
 *         schema: { type: string }
 *         description: Unique file key returned during upload (may include category subpath)
 *     responses:
 *       200: { description: File stream with appropriate Content-Type headers }
 *       404: { description: File not found }
 */
router.get('/:fileKey', protect, getFile);

// ─── Signed URL ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/uploads/{fileKey}/signed-url:
 *   get:
 *     summary: Generate a time-limited signed URL for direct cloud storage access
 *     description: |
 *       Returns a pre-signed URL for S3 or GCS that allows temporary direct access
 *       without proxying through the API server. Falls back to standard URL for local storage.
 *     tags: [File Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileKey
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: expiresIn
 *         schema: { type: integer, default: 3600 }
 *         description: URL validity in seconds (max 604800 for GCS, 604800 for S3)
 *     responses:
 *       200:
 *         description: Signed URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:      { type: boolean }
 *                 signedUrl:    { type: string }
 *                 expiresInSec: { type: integer, nullable: true }
 *                 fileKey:      { type: string }
 *       404: { description: File not found }
 *       500: { description: Signed URL generation failed }
 */
router.get('/:fileKey/signed-url', protect, getSignedUrl);

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/uploads/{fileKey}:
 *   delete:
 *     summary: Delete a stored file from the active storage provider
 *     description: |
 *       Idempotent — returns 200 even if the file did not exist.
 *       Restricted to admin role to prevent unauthorised data deletion.
 *     tags: [File Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileKey
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: File deleted (or did not exist) }
 *       403: { description: Insufficient permissions }
 */
router.delete('/:fileKey', protect, authorize('admin', 'instructor'), deleteFile);

export default router;
