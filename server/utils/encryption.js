import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

const getSecretKey = () => {
  const secret = process.env.ENCRYPTION_KEY || 'default_secret_key_for_encryption_must_be_32_bytes';
  return crypto.createHash('sha256').update(secret).digest();
};

export const encrypt = (text) => {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

export const decrypt = (encryptedText) => {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Deterministic encryption for database lookups
export const encryptDeterministic = (text) => {
  if (!text) return text;
  const iv = Buffer.alloc(16, 0); // Fixed IV
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

export const decryptDeterministic = (encryptedText) => {
  if (!encryptedText) return encryptedText;
  const iv = Buffer.alloc(16, 0); // Fixed IV
  const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
