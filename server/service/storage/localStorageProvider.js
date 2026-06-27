import fs from 'fs';
import path from 'path';
import { StorageProvider } from './storageProvider.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Local Disk Storage Provider
 *
 * Stores files in a secure directory on the local filesystem.
 * Suitable for development and single-server deployments.
 *
 * Note: getSignedUrl() is not supported; falls back to the
 * standard /api/uploads/:fileKey endpoint URL.
 */
export class LocalStorageProvider extends StorageProvider {
  constructor(secureUploadDir = 'secure-uploads') {
    super();
    this.uploadDir = path.resolve(secureUploadDir);

    // Ensure the upload directory exists on startup
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Resolve an absolute path for a file key while guarding against
   * directory traversal attacks. Sub-paths (category/uuid.ext) are allowed.
   */
  _resolvePath(fileKey) {
    // Normalise and strip any traversal sequences
    const normalised = path.normalize(fileKey).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath   = path.join(this.uploadDir, normalised);

    // Ensure the resolved path stays within uploadDir
    if (!fullPath.startsWith(this.uploadDir + path.sep) && fullPath !== this.uploadDir) {
      throw new Error(`Path traversal attempt detected for key: ${fileKey}`);
    }
    return fullPath;
  }

  async uploadFile(buffer, fileKey, mimeType) {
    const targetPath = this._resolvePath(fileKey);

    // Ensure the parent subdirectory exists (e.g., secure-uploads/images/)
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.writeFile(targetPath, buffer);

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return {
      key: fileKey,
      url: `${baseUrl}/api/uploads/${fileKey}`
    };
  }

  async deleteFile(fileKey) {
    const targetPath = this._resolvePath(fileKey);
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
      return true;
    }
    return false;
  }

  async getFileUrl(fileKey) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/api/uploads/${fileKey}`;
  }

  async getFileStream(fileKey) {
    const targetPath = this._resolvePath(fileKey);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`File not found on disk: ${fileKey}`);
    }
    return fs.createReadStream(targetPath);
  }

  /**
   * Local storage does not support cryptographic signed URLs.
   * Throws with "not supported" so the service layer can fall back gracefully.
   */
  async getSignedUrl(fileKey, _expiresInSec) {
    throw new Error('getSignedUrl() is not supported by the local storage provider.');
  }
}
