import { StorageProvider } from './storageProvider.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Google Cloud Storage (GCS) Provider
 *
 * Stores files in a GCS bucket. Supports:
 *  - Upload (via stream or Buffer)
 *  - Delete
 *  - Public URL generation
 *  - Signed URL generation (v4 signing) with configurable TTL
 *  - Streaming download
 *
 * The @google-cloud/storage package is loaded dynamically to avoid
 * crashing the server when it is not installed.
 *
 * Required ENV vars:
 *   STORAGE_PROVIDER=gcs
 *   GCS_BUCKET_NAME
 *
 * Authentication (pick one):
 *   GCS_KEY_FILE       — Path to a service account JSON key file
 *   GOOGLE_APPLICATION_CREDENTIALS — Standard ADC env var (alternative)
 *
 * Optional ENV vars:
 *   GCS_PROJECT_ID     — Google Cloud project ID (auto-detected from key file if omitted)
 *   GCS_PUBLIC_BUCKET  — Set to 'true' if the bucket has allUsers READ IAM role
 */
export class GCSStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.bucketName  = process.env.GCS_BUCKET_NAME;
    this.projectId   = process.env.GCS_PROJECT_ID   || undefined;
    this.keyFilename = process.env.GCS_KEY_FILE      || undefined;
    this.isPublic    = process.env.GCS_PUBLIC_BUCKET === 'true';
    this._storage    = null;
    this._bucket     = null;
  }

  /**
   * Lazily initialise the @google-cloud/storage client.
   */
  async _getBucket() {
    if (this._bucket) return this._bucket;
    try {
      const { Storage } = await import('@google-cloud/storage');
      this._storage = new Storage({
        ...(this.projectId   && { projectId:   this.projectId   }),
        ...(this.keyFilename && { keyFilename: this.keyFilename }),
      });
      this._bucket = this._storage.bucket(this.bucketName);
      return this._bucket;
    } catch {
      throw new Error(
        'GCS provider requires @google-cloud/storage. ' +
        'Run: npm install @google-cloud/storage'
      );
    }
  }

  async uploadFile(buffer, fileKey, mimeType) {
    const bucket = await this._getBucket();
    const file   = bucket.file(fileKey);

    await file.save(buffer, {
      metadata:   { contentType: mimeType },
      resumable:  false, // Buffer uploads don't need resumable sessions
    });

    // If bucket is public, return the public URL directly
    const url = this.isPublic
      ? `https://storage.googleapis.com/${this.bucketName}/${fileKey}`
      : await this.getSignedUrl(fileKey, 3600);

    return { key: fileKey, url };
  }

  async deleteFile(fileKey) {
    const bucket = await this._getBucket();
    try {
      await bucket.file(fileKey).delete();
      return true;
    } catch (err) {
      if (err.code === 404) return false;
      throw err;
    }
  }

  async getFileUrl(fileKey) {
    if (this.isPublic) {
      return `https://storage.googleapis.com/${this.bucketName}/${fileKey}`;
    }
    // For private buckets, return a short-lived signed URL as the "default" URL
    return this.getSignedUrl(fileKey, 3600);
  }

  async getFileStream(fileKey) {
    const bucket = await this._getBucket();
    const file   = bucket.file(fileKey);
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File not found in GCS: ${fileKey}`);
    }
    return file.createReadStream();
  }

  /**
   * Generate a V4 signed URL for temporary secure access to a private GCS object.
   *
   * @param {string} fileKey       - GCS object key
   * @param {number} expiresInSec  - URL lifetime in seconds (max 604800 for V4)
   * @returns {Promise<string>}
   */
  async getSignedUrl(fileKey, expiresInSec = 3600) {
    const bucket = await this._getBucket();
    const file   = bucket.file(fileKey);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action:  'read',
      expires: Date.now() + expiresInSec * 1000,
    });

    return signedUrl;
  }
}
