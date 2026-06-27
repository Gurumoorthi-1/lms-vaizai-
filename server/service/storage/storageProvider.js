/**
 * Abstract Storage Provider Interface
 *
 * All storage backends (local, S3, GCS, Azure, etc.) must implement
 * these methods. Use this as a contract — never instantiate directly.
 */
export class StorageProvider {
  /**
   * Upload a file from a buffer to storage.
   *
   * @param {Buffer} buffer    - File contents
   * @param {string} fileKey   - Unique key / path within the storage bucket/directory
   * @param {string} mimeType  - MIME type of the file
   * @returns {Promise<{ key: string, url: string }>}
   */
  async uploadFile(buffer, fileKey, mimeType) {
    throw new Error('uploadFile() must be implemented by the storage provider.');
  }

  /**
   * Delete a file from storage.
   *
   * @param {string} fileKey - Key of the file to delete
   * @returns {Promise<boolean>} true if deleted, false if not found
   */
  async deleteFile(fileKey) {
    throw new Error('deleteFile() must be implemented by the storage provider.');
  }

  /**
   * Return the public (or internal) URL for a file.
   *
   * @param {string} fileKey
   * @returns {Promise<string>}
   */
  async getFileUrl(fileKey) {
    throw new Error('getFileUrl() must be implemented by the storage provider.');
  }

  /**
   * Return a readable stream of the file contents.
   * Used for secure, server-proxied file delivery.
   *
   * @param {string} fileKey
   * @returns {Promise<NodeJS.ReadableStream>}
   */
  async getFileStream(fileKey) {
    throw new Error('getFileStream() must be implemented by the storage provider.');
  }

  /**
   * Generate a time-limited signed URL for temporary secure access.
   * Providers that do not support signed URLs should throw an Error
   * with the message containing "not supported" — the upload service
   * will then fall back to getFileUrl().
   *
   * @param {string} fileKey       - File key in storage
   * @param {number} expiresInSec  - TTL in seconds (default 3600)
   * @returns {Promise<string>}    - The signed URL string
   */
  async getSignedUrl(fileKey, expiresInSec = 3600) {
    throw new Error('getSignedUrl() is not supported by this storage provider.');
  }
}
