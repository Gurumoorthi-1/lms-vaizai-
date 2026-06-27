import { StorageProvider } from './storageProvider.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * AWS S3 Storage Provider
 *
 * Stores files in an S3 bucket. Supports:
 *  - Upload (PutObject)
 *  - Delete (DeleteObject)
 *  - Public URL generation
 *  - Pre-signed URL generation (GetObject) with configurable TTL
 *  - Streaming download via GetObject
 *
 * Dependencies are loaded dynamically to avoid crashing the server
 * when @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner are not installed.
 *
 * Required ENV vars:
 *   STORAGE_PROVIDER=s3
 *   AWS_BUCKET_NAME
 *   AWS_REGION
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *
 * Optional ENV vars:
 *   AWS_S3_ACL      — e.g. 'public-read' (omit for private bucket)
 *   AWS_S3_ENDPOINT — Custom endpoint for S3-compatible APIs (MinIO, Backblaze B2, etc.)
 */
export class S3StorageProvider extends StorageProvider {
  constructor() {
    super();
    this.bucketName = process.env.AWS_BUCKET_NAME;
    this.region     = process.env.AWS_REGION     || 'ap-south-1';
    this.acl        = process.env.AWS_S3_ACL     || null;   // null = private bucket
    this.endpoint   = process.env.AWS_S3_ENDPOINT || null;  // null = AWS default
    this._client    = null;
  }

  /**
   * Lazily initialise the S3 client on first use.
   * Throws a descriptive error if the SDK package is not installed.
   */
  async _getClient() {
    if (this._client) return this._client;
    try {
      const { S3Client } = await import('@aws-sdk/client-s3');
      this._client = new S3Client({
        region: this.region,
        ...(this.endpoint && { endpoint: this.endpoint, forcePathStyle: true }),
        credentials: {
          accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      return this._client;
    } catch {
      throw new Error(
        'S3 provider requires @aws-sdk/client-s3. ' +
        'Run: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner'
      );
    }
  }

  async uploadFile(buffer, fileKey, mimeType) {
    const client = await this._getClient();
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');

    const params = {
      Bucket:      this.bucketName,
      Key:         fileKey,
      Body:        buffer,
      ContentType: mimeType,
      ...(this.acl && { ACL: this.acl }),
    };

    await client.send(new PutObjectCommand(params));

    return {
      key: fileKey,
      url: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileKey}`
    };
  }

  async deleteFile(fileKey) {
    const client = await this._getClient();
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await client.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: fileKey }));
    return true;
  }

  async getFileUrl(fileKey) {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileKey}`;
  }

  async getFileStream(fileKey) {
    const client = await this._getClient();
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const response = await client.send(new GetObjectCommand({ Bucket: this.bucketName, Key: fileKey }));
    return response.Body; // ReadableStream from SDK
  }

  /**
   * Generate a pre-signed GET URL valid for expiresInSec seconds.
   * Allows temporary, unauthenticated access to private S3 objects.
   */
  async getSignedUrl(fileKey, expiresInSec = 3600) {
    const client = await this._getClient();
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl }     = await import('@aws-sdk/s3-request-presigner').catch(() => {
      throw new Error(
        'S3 signed URLs require @aws-sdk/s3-request-presigner. ' +
        'Run: npm install @aws-sdk/s3-request-presigner'
      );
    });

    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: this.bucketName, Key: fileKey }),
      { expiresIn: expiresInSec }
    );
  }
}
