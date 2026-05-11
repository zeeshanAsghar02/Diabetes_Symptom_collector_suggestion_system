import crypto from 'crypto';

/**
 * Field-level encryption utility for HIPAA/GDPR compliance
 * Uses AES-256-CBC encryption with secure key derivation
 */

class EncryptionUtil {
  constructor() {
    // Get encryption key from environment or generate
    const keyStr = process.env.ENCRYPTION_KEY;
    if (!keyStr) {
      console.warn('⚠️ WARNING: ENCRYPTION_KEY not found in .env. Please set it for production.');
      // Generate a temporary key (for development only)
      this.key = crypto.randomBytes(32);
    } else {
      // Convert hex string to buffer
      this.key = Buffer.from(keyStr, 'hex');
      if (this.key.length !== 32) {
        throw new Error(
          'ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes for AES-256)'
        );
      }
    }

    // Algorithm: AES-256-CBC
    this.algorithm = 'aes-256-cbc';
  }

  /**
   * Encrypt plaintext using AES-256-CBC
   * Returns IV:encryptedData in hex format for storage
   * @param {string|number} plaintext - Data to encrypt
   * @returns {string} IV:encryptedData format
   */
  encrypt(plaintext) {
    if (plaintext === null || plaintext === undefined || plaintext === '') {
      return null;
    }

    try {
      // Convert number to string if needed
      const textToEncrypt = String(plaintext);

      // Generate random IV (Initialization Vector) for each encryption
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      // Encrypt the data
      let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Return IV:encrypted format (IV is needed for decryption)
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error.message);
      throw new Error(`Failed to encrypt data: ${error.message}`);
    }
  }

  /**
   * Decrypt data encrypted with encrypt()
   * Expects data in IV:encryptedData format
   * @param {string} encryptedData - Encrypted data in IV:encryptedData format
   * @returns {string} Decrypted plaintext
   */
  decrypt(encryptedData) {
    if (!encryptedData || typeof encryptedData !== 'string') {
      return null;
    }

    try {
      // Split IV and encrypted data
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error.message);
      throw new Error(`Failed to decrypt data: ${error.message}`);
    }
  }

  /**
   * Check if data appears to be encrypted (has IV:data format)
   * @param {string} data - Data to check
   * @returns {boolean} True if data looks encrypted
   */
  isEncrypted(data) {
    if (!data || typeof data !== 'string') {
      return false;
    }
    return data.includes(':') && /^[a-f0-9]{32}:.+$/.test(data);
  }

  /**
   * Encrypt nested object fields
   * @param {object} obj - Object to encrypt
   * @param {array} fieldsToEncrypt - Array of field names to encrypt
   * @returns {object} Object with encrypted fields
   */
  encryptObject(obj, fieldsToEncrypt) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const encrypted = { ...obj };
    fieldsToEncrypt.forEach((field) => {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    });
    return encrypted;
  }

  /**
   * Decrypt nested object fields
   * @param {object} obj - Object to decrypt
   * @param {array} fieldsToDecrypt - Array of field names to decrypt
   * @returns {object} Object with decrypted fields
   */
  decryptObject(obj, fieldsToDecrypt) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const decrypted = { ...obj };
    fieldsToDecrypt.forEach((field) => {
      if (decrypted[field] && this.isEncrypted(decrypted[field])) {
        decrypted[field] = this.decrypt(decrypted[field]);
      }
    });
    return decrypted;
  }

  /**
   * Generate a new encryption key (for key rotation)
   * Returns 64-character hex string (256 bits for AES-256)
   * @returns {string} New encryption key as hex string
   */
  static generateNewKey() {
    const newKey = crypto.randomBytes(32);
    return newKey.toString('hex');
  }

  /**
   * Re-encrypt data with a new key (for key rotation)
   * @param {string} encryptedData - Data encrypted with old key
   * @param {Buffer} oldKey - Old encryption key
   * @param {Buffer} newKey - New encryption key
   * @returns {string} Data re-encrypted with new key
   */
  static rotateKey(encryptedData, oldKey, newKey) {
    if (!encryptedData) {
      return null;
    }

    try {
      // Decrypt with old key
      const oldUtil = new EncryptionUtil();
      oldUtil.key = oldKey;
      const decrypted = oldUtil.decrypt(encryptedData);

      // Encrypt with new key
      const newUtil = new EncryptionUtil();
      newUtil.key = newKey;
      return newUtil.encrypt(decrypted);
    } catch (error) {
      console.error('Key rotation error:', error.message);
      throw new Error(`Failed to rotate key: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new EncryptionUtil();
