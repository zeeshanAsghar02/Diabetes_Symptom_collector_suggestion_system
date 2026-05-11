import encryptionService from '../../services/encryptionService.js';

/**
 * AuditLog Model Encryption Middleware
 * Handles encryption/decryption of sensitive PII/PHI in audit logs
 */

/**
 * Pre-save hook for AuditLog model
 * Encrypts changes.after field if involves_pii or involves_phi
 */
export function encryptAuditLogData(next) {
    try {
        if (this.involves_pii && this.changes?.after && typeof this.changes.after === 'object') {
            const fieldsToEncrypt = Object.keys(this.changes.after);
            if (fieldsToEncrypt.length > 0) {
                this.changes.after = encryptionService.encryptObject(this.changes.after, fieldsToEncrypt);
            }
        }
        if (this.involves_phi && this.changes?.after && typeof this.changes.after === 'object') {
            const fieldsToEncrypt = Object.keys(this.changes.after);
            if (fieldsToEncrypt.length > 0) {
                this.changes.after = encryptionService.encryptObject(this.changes.after, fieldsToEncrypt);
            }
        }
    } catch (error) {
        console.warn('Audit log encryption warning:', error.message);
    }
    next();
}

/**
 * Decryption function for AuditLog model
 */
export function decryptAuditLogData(doc) {
    if (doc && doc.changes?.after && typeof doc.changes.after === 'object') {
        try {
            const fieldsToDecrypt = Object.keys(doc.changes.after);
            if (fieldsToDecrypt.length > 0 && (doc.involves_pii || doc.involves_phi)) {
                doc.changes.after = encryptionService.decryptObject(doc.changes.after, fieldsToDecrypt);
            }
        } catch (err) {
            console.warn('Audit log decryption warning:', err.message);
        }
    }
}

/**
 * Post-find hook for array decryption
 */
export function decryptAuditLogArrayData(docs) {
    if (docs && Array.isArray(docs)) {
        docs.forEach(decryptAuditLogData);
    }
}
