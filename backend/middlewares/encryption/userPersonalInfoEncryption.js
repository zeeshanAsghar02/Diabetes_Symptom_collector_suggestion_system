import encryptionService from '../../services/encryptionService.js';

/**
 * UserPersonalInfo Model Encryption Middleware
 * Handles encryption/decryption of sensitive personal data
 */

/**
 * Pre-save hook for UserPersonalInfo model
 */
export function encryptPersonalData(next) {
  try {
    // Encrypt date of birth
    if (this.date_of_birth) {
      const dateValue = typeof this.date_of_birth === 'string'
        ? this.date_of_birth
        : this.date_of_birth.toISOString();
      if (!encryptionService.isEncrypted(dateValue)) {
        this.date_of_birth = encryptionService.encrypt(dateValue);
      }
    }

    // Encrypt gender
    if (this.gender && !encryptionService.isEncrypted(this.gender)) {
      this.gender = encryptionService.encrypt(this.gender);
    }

    // Encrypt height and weight
    if (this.height && !encryptionService.isEncrypted(String(this.height))) {
      this.height = encryptionService.encrypt(String(this.height));
    }
    if (this.weight && !encryptionService.isEncrypted(String(this.weight))) {
      this.weight = encryptionService.encrypt(String(this.weight));
    }

    // Encrypt activity level
    if (this.activity_level && !encryptionService.isEncrypted(this.activity_level)) {
      this.activity_level = encryptionService.encrypt(this.activity_level);
    }

    // Encrypt dietary preference
    if (this.dietary_preference && !encryptionService.isEncrypted(this.dietary_preference)) {
      this.dietary_preference = encryptionService.encrypt(this.dietary_preference);
    }

    // Encrypt smoking status
    if (this.smoking_status && !encryptionService.isEncrypted(this.smoking_status)) {
      this.smoking_status = encryptionService.encrypt(this.smoking_status);
    }

    // Encrypt alcohol use
    if (this.alcohol_use && !encryptionService.isEncrypted(this.alcohol_use)) {
      this.alcohol_use = encryptionService.encrypt(this.alcohol_use);
    }

    // Encrypt sleep hours
    if (this.sleep_hours && !encryptionService.isEncrypted(String(this.sleep_hours))) {
      this.sleep_hours = encryptionService.encrypt(String(this.sleep_hours));
    }

    // Encrypt address components
    if (this.address) {
      if (this.address.street && !encryptionService.isEncrypted(this.address.street)) {
        this.address.street = encryptionService.encrypt(this.address.street);
      }
      if (this.address.city && !encryptionService.isEncrypted(this.address.city)) {
        this.address.city = encryptionService.encrypt(this.address.city);
      }
      if (this.address.state && !encryptionService.isEncrypted(this.address.state)) {
        this.address.state = encryptionService.encrypt(this.address.state);
      }
      if (this.address.zip_code && !encryptionService.isEncrypted(this.address.zip_code)) {
        this.address.zip_code = encryptionService.encrypt(this.address.zip_code);
      }
      if (this.address.country && !encryptionService.isEncrypted(this.address.country)) {
        this.address.country = encryptionService.encrypt(this.address.country);
      }
    }

    // Encrypt emergency contact information
    if (this.emergency_contact) {
      if (this.emergency_contact.name && !encryptionService.isEncrypted(this.emergency_contact.name)) {
        this.emergency_contact.name = encryptionService.encrypt(this.emergency_contact.name);
      }
      if (this.emergency_contact.phone && !encryptionService.isEncrypted(this.emergency_contact.phone)) {
        this.emergency_contact.phone = encryptionService.encrypt(this.emergency_contact.phone);
      }
      if (this.emergency_contact.relationship && !encryptionService.isEncrypted(this.emergency_contact.relationship)) {
        this.emergency_contact.relationship = encryptionService.encrypt(this.emergency_contact.relationship);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Decryption function for UserPersonalInfo model
 */
export function decryptPersonalData(doc) {
  if (!doc) return;

  try {
    // Decrypt date of birth
    if (doc.date_of_birth && typeof doc.date_of_birth === 'string' && encryptionService.isEncrypted(doc.date_of_birth)) {
      doc.date_of_birth = new Date(encryptionService.decrypt(doc.date_of_birth));
    }

    // Decrypt gender
    if (doc.gender && encryptionService.isEncrypted(doc.gender)) {
      doc.gender = encryptionService.decrypt(doc.gender);
    }

    // Decrypt height and weight
    if (doc.height && encryptionService.isEncrypted(String(doc.height))) {
      doc.height = parseFloat(encryptionService.decrypt(doc.height));
    }
    if (doc.weight && encryptionService.isEncrypted(String(doc.weight))) {
      doc.weight = parseFloat(encryptionService.decrypt(doc.weight));
    }

    // Decrypt activity level
    if (doc.activity_level && encryptionService.isEncrypted(doc.activity_level)) {
      doc.activity_level = encryptionService.decrypt(doc.activity_level);
    }

    // Decrypt dietary preference
    if (doc.dietary_preference && encryptionService.isEncrypted(doc.dietary_preference)) {
      doc.dietary_preference = encryptionService.decrypt(doc.dietary_preference);
    }

    // Decrypt smoking status
    if (doc.smoking_status && encryptionService.isEncrypted(doc.smoking_status)) {
      doc.smoking_status = encryptionService.decrypt(doc.smoking_status);
    }

    // Decrypt alcohol use
    if (doc.alcohol_use && encryptionService.isEncrypted(doc.alcohol_use)) {
      doc.alcohol_use = encryptionService.decrypt(doc.alcohol_use);
    }

    // Decrypt sleep hours
    if (doc.sleep_hours && encryptionService.isEncrypted(String(doc.sleep_hours))) {
      doc.sleep_hours = parseInt(encryptionService.decrypt(doc.sleep_hours));
    }

    // Decrypt address
    if (doc.address) {
      if (doc.address.street && encryptionService.isEncrypted(doc.address.street)) {
        doc.address.street = encryptionService.decrypt(doc.address.street);
      }
      if (doc.address.city && encryptionService.isEncrypted(doc.address.city)) {
        doc.address.city = encryptionService.decrypt(doc.address.city);
      }
      if (doc.address.state && encryptionService.isEncrypted(doc.address.state)) {
        doc.address.state = encryptionService.decrypt(doc.address.state);
      }
      if (doc.address.zip_code && encryptionService.isEncrypted(doc.address.zip_code)) {
        doc.address.zip_code = encryptionService.decrypt(doc.address.zip_code);
      }
      if (doc.address.country && encryptionService.isEncrypted(doc.address.country)) {
        doc.address.country = encryptionService.decrypt(doc.address.country);
      }
    }

    // Decrypt emergency contact
    if (doc.emergency_contact) {
      if (doc.emergency_contact.name && encryptionService.isEncrypted(doc.emergency_contact.name)) {
        doc.emergency_contact.name = encryptionService.decrypt(doc.emergency_contact.name);
      }
      if (doc.emergency_contact.phone && encryptionService.isEncrypted(doc.emergency_contact.phone)) {
        doc.emergency_contact.phone = encryptionService.decrypt(doc.emergency_contact.phone);
      }
      if (doc.emergency_contact.relationship && encryptionService.isEncrypted(doc.emergency_contact.relationship)) {
        doc.emergency_contact.relationship = encryptionService.decrypt(doc.emergency_contact.relationship);
      }
    }
  } catch (error) {
    console.error('Personal info decryption error:', error.message);
  }
}

/**
 * Post-find hook for array decryption
 */
export function decryptPersonalArrayData(docs) {
  if (Array.isArray(docs)) {
    docs.forEach(decryptPersonalData);
  }
}
