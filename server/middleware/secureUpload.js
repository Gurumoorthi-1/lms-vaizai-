/**
 * Secure Upload Middleware
 *
 * A factory middleware that applies a full validation pipeline to uploaded files:
 *   1. Multer memory storage (buffer, never touches disk until validated)
 *   2. File size enforcement (per-category limit)
 *   3. Extension whitelist check
 *   4. MIME type whitelist check
 *   5. Magic number / file signature verification (prevents extension spoofing)
 *   6. Virus scan hook (ClamAV via virusScanner.js)
 *
 * Usage:
 *   router.post('/upload', secureUpload('image', 'file'), uploadController.uploadFile);
 *
 * All validation errors are sent as structured JSON matching UploadError format.
 * On success, req.file is populated with the validated buffer and metadata.
 */

import multer from 'multer';
import path from 'path';
import { scanFile } from '../utils/virusScanner.js';

// ─── Per-Category Configuration ───────────────────────────────────────────────

const CONFIGS = {
  image: {
    allowedExts:  ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
    allowedMimes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    maxSize:       5 * 1024 * 1024,  // 5 MB
  },
  video: {
    allowedExts:  ['.mp4', '.mov', '.avi', '.mkv'],
    allowedMimes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
    maxSize:       100 * 1024 * 1024, // 100 MB
  },
  pdf: {
    allowedExts:  ['.pdf'],
    allowedMimes: ['application/pdf'],
    maxSize:       20 * 1024 * 1024,  // 20 MB
  },
  assignment: {
    allowedExts:  ['.pdf', '.doc', '.docx', '.zip', '.txt', '.png', '.jpg', '.jpeg'],
    allowedMimes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed',
      'text/plain',
      'image/png',
      'image/jpeg',
    ],
    maxSize: 10 * 1024 * 1024, // 10 MB
  },
};

// ─── Magic Number Validator ───────────────────────────────────────────────────

/**
 * Validate a file buffer against expected file signatures (magic bytes).
 * Prevents attackers from uploading malicious files with renamed extensions.
 *
 * @param {Buffer} buffer  - The full file buffer
 * @param {string} ext     - Lowercase extension including dot (e.g. '.jpg')
 * @returns {boolean}      - true if signatures match, false if mismatch
 */
const validateMagicNumbers = (buffer, ext) => {
  if (buffer.length < 8) return false;

  const hex4  = buffer.toString('hex', 0, 4).toLowerCase();
  const hex8  = buffer.toString('hex', 0, 8).toLowerCase();

  switch (ext) {
    case '.pdf':
      // %PDF
      return hex4 === '25504446';

    case '.png':
      // .PNG
      return hex4 === '89504e47';

    case '.jpg':
    case '.jpeg':
      // JFIF / EXIF SOI marker
      return hex4.startsWith('ffd8ff');

    case '.gif':
      // GIF8
      return hex4 === '47494638';

    case '.webp':
      // RIFF????WEBP
      return hex4 === '52494646' && buffer.toString('hex', 8, 12).toLowerCase() === '57454250';

    case '.zip':
      // PK.. (ZIP local file header)
      return hex4 === '504b0304';

    case '.docx':
      // DOCX is a ZIP — PK..
      return hex4 === '504b0304';

    case '.doc':
      // OLE2 Compound Document (D0CF11E0A1B11AE1)
      return hex8 === 'd0cf11e0a1b11ae1';

    case '.txt':
      // Plain text — reject if binary null bytes in first 512 bytes
      for (let i = 0; i < Math.min(buffer.length, 512); i++) {
        if (buffer[i] === 0) return false;
      }
      return true;

    case '.mp4':
      // ftyp box at offset 4 (most common): 00 00 00 XX 66 74 79 70
      return buffer.toString('hex', 4, 8).toLowerCase() === '66747970';

    case '.mov':
      // QuickTime: ftyp or wide or mdat boxes
      return (
        buffer.toString('hex', 4, 8).toLowerCase() === '66747970' ||
        buffer.toString('hex', 4, 8).toLowerCase() === '77696465' ||
        buffer.toString('hex', 4, 8).toLowerCase() === '6d646174'
      );

    case '.avi':
      // RIFF????AVI (RIFF header + AVI marker at offset 8)
      return hex4 === '52494646' && buffer.toString('hex', 8, 12).toLowerCase() === '41564920';

    case '.mkv':
      // EBML header (Matroska/WebM)
      return hex4 === '1a45dfa3';

    default:
      // Unknown extensions pass by default (the extension/MIME check is the primary guard)
      return true;
  }
};

// ─── Structured Error Response Helper ────────────────────────────────────────

const rejectUpload = (res, code, message, statusCode = 400, details = null) =>
  res.status(statusCode).json({
    success: false,
    code,
    message,
    ...(details ? { details } : {})
  });

// ─── Middleware Factory ───────────────────────────────────────────────────────

/**
 * Create and return a complete upload validation middleware stack for the given category.
 *
 * @param {string} category  - 'image' | 'video' | 'pdf' | 'assignment'
 * @param {string} fieldName - Multipart field name (default: 'file')
 * @returns {express.RequestHandler}
 */
export const secureUpload = (category, fieldName = 'file', options = {}) => {
  const { optional = false } = options;
  const config = CONFIGS[category];

  if (!config) {
    throw new Error(
      `Invalid upload category: "${category}". ` +
      `Valid options: ${Object.keys(CONFIGS).join(', ')}`
    );
  }

  const maxSizeMB = config.maxSize / (1024 * 1024);

  const multerUpload = multer({
    storage: multer.memoryStorage(), // Hold in memory until validation passes
    limits:  { fileSize: config.maxSize },
  }).single(fieldName);

  return (req, res, next) => {
    multerUpload(req, res, async (err) => {

      // ── Step 1: Multer-level errors (size exceeded, unexpected field, etc.) ──
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return rejectUpload(
            res,
            'FILE_SIZE_EXCEEDED',
            `File exceeds the ${maxSizeMB}MB limit for category "${category}".`,
            413,
            { category, maxSizeMB }
          );
        }
        return rejectUpload(res, 'UPLOAD_ERROR', err.message);
      }

      // ── Step 2: Presence check ──
      const file = req.file;
      if (!file) {
        if (optional) {
          return next();
        }
        return rejectUpload(res, 'NO_FILE_PROVIDED', 'No file was provided in the request.');
      }

      const ext  = path.extname(file.originalname).toLowerCase();
      const mime = file.mimetype.toLowerCase();

      // ── Step 3: Extension whitelist ──
      if (!config.allowedExts.includes(ext)) {
        return rejectUpload(
          res,
          'INVALID_FILE_EXTENSION',
          `Extension "${ext}" is not allowed for category "${category}". ` +
          `Allowed: ${config.allowedExts.join(', ')}`,
          415,
          { ext, allowedExts: config.allowedExts }
        );
      }

      // ── Step 4: MIME type whitelist ──
      if (!config.allowedMimes.includes(mime)) {
        return rejectUpload(
          res,
          'INVALID_MIME_TYPE',
          `MIME type "${mime}" is not permitted for category "${category}".`,
          415,
          { mime, allowedMimes: config.allowedMimes }
        );
      }

      // ── Step 5: Magic number / file signature verification ──
      if (!validateMagicNumbers(file.buffer, ext)) {
        return rejectUpload(
          res,
          'MAGIC_NUMBER_MISMATCH',
          `Security alert: File content does not match extension "${ext}". ` +
          'Possible extension spoofing or corrupt file.',
          400,
          { ext }
        );
      }

      // ── Step 6: Virus scan hook ──
      try {
        await scanFile(file.buffer, file.originalname);
      } catch (scanError) {
        return rejectUpload(
          res,
          'VIRUS_DETECTED',
          scanError.message,
          400
        );
      }

      // ── All checks passed — proceed ──
      next();
    });
  };
};

export default secureUpload;
