import express from 'express';
import {
  issueCertificate, verifyCertificate, getMyCertificates,
  searchCertificates, revokeCertificate, downloadCertificate
} from '../controllers/certificate.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../validation/auth.validation.js';
import { issueCertificateSchema, revokeCertificateSchema, searchCertificateSchema } from '../validation/certificate.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Certificates
 *   description: Certificate issuance and verification
 */

/**
 * @swagger
 * /api/certificates/verify/{certificateId}:
 *   get:
 *     summary: Publicly verify a certificate by its UUID (QR scan target)
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: certificateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificate details
 *       404:
 *         description: Certificate not found
 */
// Public endpoint — no auth required (used by QR code scan)
router.get('/verify/:certificateId', verifyCertificate);
router.get('/download/:certificateId', downloadCertificate);

// Protected endpoints
router.get('/me', protect, getMyCertificates);
router.get('/search', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), validate(searchCertificateSchema), searchCertificates);
router.post('/', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), validate(issueCertificateSchema), issueCertificate);
router.put('/:certificateId/revoke', protect, authorize('ADMIN', 'INSTRUCTOR', 'TEACHER'), validate(revokeCertificateSchema), revokeCertificate);

export default router;
