/**
 * Upload Service — Production-Ready
 *
 * Features:
 *  - Category-aware file routing (image, video, pdf, assignment)
 *  - Unique file naming (UUID-based, collision-safe)
 *  - Category subdirectory organisation in storage
 *  - Signed URL generation for private files (S3/GCS)
 *  - File deletion from storage
 *  - Typed error classes (upload.errors.js)
 *  - Zero HTTP/transport logic — pure business service
 */

import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import storageManager from './storage/storageManager.js';
import {
  NoFileProvidedError,
  StorageUploadError,
  FileNotFoundError,
  SignedUrlGenerationError
} from '../utils/upload.errors.js';

// ─── Subdirectory Map ─────────────────────────────────────────────────────────
// Files are stored in category-named subdirectories for organisation.
// The storage provider uses these prefixes as part of the file key.

const CATEGORY_DIR = {
  image:      'images',
  video:      'videos',
  pdf:        'pdfs',
  assignment: 'assignments',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a globally unique, collision-safe file key with optional subdirectory.
 *
 * @param {string} originalName - Original filename from uploader
 * @param {string} [category]   - Upload category (determines subdirectory)
 * @returns {string} e.g. "images/550e8400-e29b-41d4-a716-446655440000.jpg"
 */
const buildFileKey = (originalName, category) => {
  const ext       = path.extname(originalName).toLowerCase();
  const uuid      = uuidv4();
  const dir       = CATEGORY_DIR[category] || 'misc';
  return `${dir}/${uuid}${ext}`;
};

// ─── Upload Service ───────────────────────────────────────────────────────────

export const uploadService = {

  /**
   * Upload a validated file buffer to the configured storage provider.
   *
   * Expects the file to have already passed secureUpload middleware validation
   * (extension, MIME, magic numbers, virus scan). This method handles:
   *  - Unique key generation with category subdirectory
   *  - Delegation to the storage manager
   *  - Structured error wrapping
   *
   * @param {Express.Multer.File} file       - multer file object (buffer in memory)
   * @param {string}              [category] - Upload category for subdirectory routing
   * @returns {Promise<{ key: string, url: string, originalName: string, size: number, mimeType: string }>}
   */
  uploadFile: async (file, category = 'assignment') => {
    if (!file) {
      throw new NoFileProvidedError();
    }

    const fileKey = buildFileKey(file.originalname, category);

    let uploadResult;
    try {
      uploadResult = await storageManager.uploadFile(file.buffer, fileKey, file.mimetype);
    } catch (err) {
      throw new StorageUploadError(err.message);
    }

    return {
      key:          uploadResult.key,
      url:          uploadResult.url,
      originalName: file.originalname,
      size:         file.size,
      mimeType:     file.mimetype,
      category,
    };
  },

  /**
   * Generate a time-limited signed URL for secure private access to a file.
   * Falls back to the standard file URL if signed URLs are not supported
   * by the active storage provider.
   *
   * @param {string} fileKey        - The unique key returned during upload
   * @param {number} [expiresInSec] - TTL for the signed URL in seconds (default: 3600)
   * @returns {Promise<{ signedUrl: string, expiresInSec: number }>}
   */
  getSignedUrl: async (fileKey, expiresInSec = 3600) => {
    const safeKey = path.basename(fileKey); // guard against traversal
    try {
      const signedUrl = await storageManager.getSignedUrl(safeKey, expiresInSec);
      return { signedUrl, expiresInSec };
    } catch (err) {
      if (err.message?.includes('not supported')) {
        // Fall back gracefully for providers that don't support signed URLs
        const fallbackUrl = await storageManager.getFileUrl(safeKey);
        return { signedUrl: fallbackUrl, expiresInSec: null };
      }
      throw new SignedUrlGenerationError(safeKey, err.message);
    }
  },

  /**
   * Stream a file directly from storage. Used for serving files through the API
   * without exposing raw storage URLs (critical for local provider).
   *
   * @param {string} fileKey - The unique file key
   * @returns {Promise<NodeJS.ReadableStream>}
   */
  getFileStream: async (fileKey) => {
    const safeKey = path.basename(fileKey);
    try {
      return await storageManager.getFileStream(safeKey);
    } catch (err) {
      if (err.message?.includes('not found') || err.code === 'NoSuchKey') {
        throw new FileNotFoundError(safeKey);
      }
      throw err;
    }
  },

  /**
   * Delete a file from storage.
   *
   * @param {string} fileKey - The unique file key to delete
   * @returns {Promise<boolean>} true if deleted, false if it did not exist
   */
  deleteFile: async (fileKey) => {
    const safeKey = path.basename(fileKey);
    try {
      return await storageManager.deleteFile(safeKey);
    } catch (err) {
      if (err.message?.includes('not found') || err.code === 'NoSuchKey') {
        return false; // idempotent — deletion of a missing file is not an error
      }
      throw new StorageUploadError(`Deletion failed for "${safeKey}": ${err.message}`);
    }
  },

  /**
   * Return the public or internal URL for a file without generating a signed token.
   * Use for files in public buckets or local development.
   *
   * @param {string} fileKey - The unique file key
   * @returns {Promise<string>}
   */
  getFileUrl: async (fileKey) => {
    const safeKey = path.basename(fileKey);
    return storageManager.getFileUrl(safeKey);
  },
};

export default uploadService;
