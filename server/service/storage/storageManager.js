/**
 * Storage Manager — Provider Factory
 *
 * Selects and initialises the appropriate storage backend based on
 * the STORAGE_PROVIDER environment variable.
 *
 * Supported values:
 *   local  — LocalStorageProvider  (default, for development / single-server)
 *   s3     — S3StorageProvider     (AWS S3 or S3-compatible: MinIO, Backblaze B2)
 *   gcs    — GCSStorageProvider    (Google Cloud Storage)
 *
 * Add new providers by:
 *   1. Creating a class in ./yourProvider.js extending StorageProvider
 *   2. Adding a case in the switch below
 *   3. Documenting required ENV vars in .env.example
 */

import { LocalStorageProvider } from './localStorageProvider.js';
import { S3StorageProvider }    from './s3StorageProvider.js';
import { GCSStorageProvider }   from './gcsStorageProvider.js';
import dotenv from 'dotenv';
dotenv.config();

const providerType = (process.env.STORAGE_PROVIDER || 'local').toLowerCase().trim();

let storageInstance;

switch (providerType) {
  case 's3':
    storageInstance = new S3StorageProvider();
    console.info('[StorageManager] Active provider: AWS S3');
    break;

  case 'gcs':
    storageInstance = new GCSStorageProvider();
    console.info('[StorageManager] Active provider: Google Cloud Storage');
    break;

  case 'local':
  default:
    storageInstance = new LocalStorageProvider();
    console.info('[StorageManager] Active provider: Local Disk');
    if (providerType !== 'local') {
      console.warn(
        `[StorageManager] Unknown STORAGE_PROVIDER value: "${providerType}". ` +
        'Falling back to local disk storage.'
      );
    }
    break;
}

export const storageManager = storageInstance;
export default storageManager;
