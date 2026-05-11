import encryptionService from '../../services/encryptionService.js';

/**
 * User Model Encryption Middleware
 * Handles encryption/decryption of sensitive PII fields
 */

/**
 * Pre-save hook for User model
 * Encrypts: phone_number, whatsapp_number
 */
export function encryptUserData(next) {
  try {
    if (this.phone_number && !encryptionService.isEncrypted(this.phone_number)) {
      this.phone_number = encryptionService.encrypt(this.phone_number);
    }
    if (this.whatsapp_number && !encryptionService.isEncrypted(this.whatsapp_number)) {
      this.whatsapp_number = encryptionService.encrypt(this.whatsapp_number);
    }
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Post-hook decryption for User model
 * Decrypts: phone_number, whatsapp_number
 */
export function decryptUserData(doc) {
  if (!doc) return;

  try {
    if (doc.phone_number && encryptionService.isEncrypted(doc.phone_number)) {
      doc.phone_number = encryptionService.decrypt(doc.phone_number);
    }
    if (doc.whatsapp_number && encryptionService.isEncrypted(doc.whatsapp_number)) {
      doc.whatsapp_number = encryptionService.decrypt(doc.whatsapp_number);
    }
  } catch (error) {
    console.error('User decryption error:', error.message);
  }
}

/**
 * Post-find hook for User model array
 */
export function decryptUserArrayData(docs) {
  if (Array.isArray(docs)) {
    docs.forEach(decryptUserData);
  }
}
