/**
 * Structured Upload Module Error Classes
 *
 * Typed errors for the file upload service layer.
 * Controllers catch these and map to HTTP responses
 * without any business knowledge embedded in transport.
 */

/**
 * Base class for all Upload module errors.
 */
export class UploadError extends Error {
  constructor(message, code = 'UPLOAD_ERROR', statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when no file is provided in the request.
 * HTTP 400.
 */
export class NoFileProvidedError extends UploadError {
  constructor() {
    super('No file was provided in the request.', 'NO_FILE_PROVIDED', 400);
  }
}

/**
 * Thrown when the file exceeds the configured size limit.
 * HTTP 413 (Payload Too Large).
 */
export class FileSizeExceededError extends UploadError {
  constructor(category, maxSizeMB) {
    super(
      `File exceeds the ${maxSizeMB}MB size limit for category "${category}".`,
      'FILE_SIZE_EXCEEDED',
      413,
      { category, maxSizeMB }
    );
  }
}

/**
 * Thrown when the file extension is not allowed.
 * HTTP 415 (Unsupported Media Type).
 */
export class InvalidFileExtensionError extends UploadError {
  constructor(ext, category, allowedExts) {
    super(
      `File extension "${ext}" is not allowed for category "${category}". Allowed: ${allowedExts.join(', ')}`,
      'INVALID_FILE_EXTENSION',
      415,
      { ext, category, allowedExts }
    );
  }
}

/**
 * Thrown when the MIME type is invalid for the given category.
 * HTTP 415 (Unsupported Media Type).
 */
export class InvalidMimeTypeError extends UploadError {
  constructor(mime, category, allowedMimes) {
    super(
      `MIME type "${mime}" is not allowed for category "${category}".`,
      'INVALID_MIME_TYPE',
      415,
      { mime, category, allowedMimes }
    );
  }
}

/**
 * Thrown when file content does not match declared extension (magic number mismatch).
 * HTTP 400 — treated as a security violation.
 */
export class MagicNumberMismatchError extends UploadError {
  constructor(ext) {
    super(
      `Security violation: File content does not match extension "${ext}". Possible extension spoofing detected.`,
      'MAGIC_NUMBER_MISMATCH',
      400,
      { ext }
    );
  }
}

/**
 * Thrown when the virus scanner detects malware.
 * HTTP 400.
 */
export class VirusScanFailedError extends UploadError {
  constructor(reason) {
    super(
      `Virus scan failed: ${reason}`,
      'VIRUS_DETECTED',
      400,
      { reason }
    );
  }
}

/**
 * Thrown when the upload category is not configured.
 * HTTP 400.
 */
export class InvalidUploadCategoryError extends UploadError {
  constructor(category) {
    super(
      `Invalid upload category: "${category}". Supported categories: image, video, pdf, assignment.`,
      'INVALID_UPLOAD_CATEGORY',
      400,
      { category }
    );
  }
}

/**
 * Thrown when the storage provider fails to persist the file.
 * HTTP 500.
 */
export class StorageUploadError extends UploadError {
  constructor(reason) {
    super(
      `Storage upload failed: ${reason}`,
      'STORAGE_UPLOAD_FAILED',
      500,
      { reason }
    );
  }
}

/**
 * Thrown when a requested file cannot be found in storage.
 * HTTP 404.
 */
export class FileNotFoundError extends UploadError {
  constructor(fileKey) {
    super(
      `File "${fileKey}" not found in storage.`,
      'FILE_NOT_FOUND',
      404,
      { fileKey }
    );
  }
}

/**
 * Thrown when a signed URL cannot be generated for a file.
 * HTTP 500.
 */
export class SignedUrlGenerationError extends UploadError {
  constructor(fileKey, reason) {
    super(
      `Failed to generate signed URL for "${fileKey}": ${reason}`,
      'SIGNED_URL_FAILED',
      500,
      { fileKey, reason }
    );
  }
}
