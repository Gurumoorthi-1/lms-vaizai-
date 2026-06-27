/**
 * Upload Controller — Transport Layer Only
 *
 * Responsibilities:
 *  - Parse request parameters (fileKey, category, query params)
 *  - Delegate to uploadService (zero business logic here)
 *  - Format HTTP responses and stream file content
 *  - Map typed UploadError → correct HTTP status codes
 *
 * All business decisions (key generation, path routing, validation) live
 * in upload.service.js or secureUpload.js middleware.
 */

import uploadService from '../service/upload.service.js';
import { UploadError } from '../utils/upload.errors.js';

// ─── MIME → Content-Type Map (transport concern only) ────────────────────────
// Used when serving files to set the correct response header.

const MIME_MAP = {
  '.pdf':  'application/pdf',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.mp4':  'video/mp4',
  '.mov':  'video/quicktime',
  '.avi':  'video/x-msvideo',
  '.mkv':  'video/x-matroska',
  '.doc':  'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.zip':  'application/zip',
  '.txt':  'text/plain'
};

// ─── Error Response Helper ────────────────────────────────────────────────────

const sendError = (res, error) => {
  if (error instanceof UploadError) {
    return res.status(error.statusCode).json({
      success: false,
      code:    error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {})
    });
  }
  console.error('[UploadController] Unexpected error:', error);
  return res.status(500).json({
    success: false,
    code:    'UPLOAD_INTERNAL_ERROR',
    message: 'An unexpected error occurred during file processing.'
  });
};

// ─── Route Handlers ───────────────────────────────────────────────────────────

/**
 * POST /api/uploads/upload?category=image|video|pdf|assignment
 *
 * Expects: req.file populated by secureUpload middleware.
 * Returns: { key, url, originalName, size, mimeType, category }
 */
export const uploadFile = async (req, res) => {
  try {
    const category = req.query.category || 'assignment';
    const result   = await uploadService.uploadFile(req.file, category);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully.',
      file:    result
    });
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * GET /api/uploads/:fileKey
 *
 * Securely streams a stored file through the API.
 * Applies Content-Security-Policy and X-Content-Type-Options headers
 * to prevent malicious files from executing in the browser context.
 */
export const getFile = async (req, res) => {
  try {
    const { fileKey }   = req.params;
    const ext           = fileKey.includes('.') ? `.${fileKey.split('.').pop().toLowerCase()}` : '';
    const contentType   = MIME_MAP[ext] || 'application/octet-stream';

    const fileStream = await uploadService.getFileStream(fileKey);

    // Enforce safe content headers — prevent in-browser execution
    res.setHeader('Content-Type',              contentType);
    res.setHeader('Content-Security-Policy',   "default-src 'none'; sandbox;");
    res.setHeader('X-Content-Type-Options',    'nosniff');
    res.setHeader('Content-Disposition',       `attachment; filename="${fileKey.split('/').pop()}"`);

    fileStream.on('error', (streamErr) => {
      console.error('[UploadController] Stream error:', streamErr.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, code: 'STREAM_ERROR', message: 'Error occurred while streaming file.' });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * GET /api/uploads/:fileKey/signed-url?expiresIn=3600
 *
 * Returns a time-limited signed URL for private cloud storage access.
 * For local storage, returns the standard URL.
 */
export const getSignedUrl = async (req, res) => {
  try {
    const { fileKey }    = req.params;
    const expiresInSec   = parseInt(req.query.expiresIn || '3600', 10);

    const result = await uploadService.getSignedUrl(fileKey, expiresInSec);

    res.json({
      success:      true,
      signedUrl:    result.signedUrl,
      expiresInSec: result.expiresInSec,
      fileKey
    });
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * DELETE /api/uploads/:fileKey
 *
 * Deletes a file from storage. Idempotent — returns success even if
 * the file didn't exist (prevents leaking existence information).
 */
export const deleteFile = async (req, res) => {
  try {
    const { fileKey } = req.params;
    await uploadService.deleteFile(fileKey);

    res.json({
      success: true,
      message: `File "${fileKey}" has been deleted.`
    });
  } catch (error) {
    sendError(res, error);
  }
};
