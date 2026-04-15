const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey() {
  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY is required in production');
    }
    // Dev fallback - not for production use
    return crypto.scryptSync('dev-key-change-in-production', 'salt', KEY_LENGTH);
  }
  if (Buffer.from(rawKey).length < KEY_LENGTH) {
    return crypto.scryptSync(rawKey, 'coparenthub-salt', KEY_LENGTH);
  }
  return Buffer.from(rawKey).slice(0, KEY_LENGTH);
}

/**
 * Encrypts a string using AES-256-GCM.
 * @param {string} text - plaintext to encrypt
 * @returns {string} - hex-encoded encrypted payload: iv:authTag:ciphertext
 */
function encrypt(text) {
  if (!text) return null;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * @param {string} encryptedData - hex-encoded: iv:authTag:ciphertext
 * @returns {string} - decrypted plaintext
 */
function decrypt(encryptedData) {
  if (!encryptedData) return null;
  const [ivHex, authTagHex, ciphertext] = encryptedData.split(':');
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
