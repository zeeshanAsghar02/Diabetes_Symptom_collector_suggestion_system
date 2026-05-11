import mongoose from 'mongoose';
import { 
    encryptAuditLogData, 
    decryptAuditLogData, 
    decryptAuditLogArrayData 
} from '../middlewares/encryption/auditLogEncryption.js';

const auditLogSchema = new mongoose.Schema({
    // User Information
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    user_email: {
        type: String,
        required: true,
        index: true,
    },
    user_role: {
        type: [String],
        required: true,
    },

    // Action Information
    action: {
        type: String,
        enum: [
            'CREATE',
            'READ',
            'UPDATE',
            'DELETE',
            'EXPORT',
            'IMPORT',
            'LOGIN',
            'LOGOUT',
            'PERMISSION_CHANGE',
            'ROLE_CHANGE',
        ],
        required: true,
        index: true,
    },
    resource: {
        type: String,
        enum: [
            'User',
            'UserPersonalInfo',
            'UserMedicalInfo',
            'Disease',
            'Symptom',
            'Question',
            'Content',
            'Role',
            'Permission',
            'RolePermissions',
            'UserRole',
            'Feedback',
            'DietPlan',
            'ExercisePlan',
            'Document',
            'Assessment',
            'Settings',
            'Auth',
        ],
        required: true,
        index: true,
    },
    resource_id: {
        type: String,
        index: true,
    },

    // Change Tracking
    changes: {
        before: mongoose.Schema.Types.Mixed,
        after: mongoose.Schema.Types.Mixed,
        fields_modified: [String],
    },

    // Metadata
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    ip_address: {
        type: String,
    },
    user_agent: {
        type: String,
    },

    // Status Information
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE', 'PARTIAL'],
        default: 'SUCCESS',
        index: true,
    },
    error_message: {
        type: String,
    },

    // Compliance Flags
    involves_pii: {
        type: Boolean,
        default: false,
    },
    involves_phi: {
        type: Boolean,
        default: false,
    },

    // Data Retention
    retention_expires_at: {
        type: Date,
        index: true,
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
}, {
    timestamps: true,
    collection: 'audit_logs',
});

// Indexes for performance
auditLogSchema.index({ user_id: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, action: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ user_email: 1, timestamp: -1 });
auditLogSchema.index({ status: 1, timestamp: -1 });

// Apply encryption middleware
auditLogSchema.pre('save', encryptAuditLogData);
auditLogSchema.post('findOne', decryptAuditLogData);
auditLogSchema.post('find', decryptAuditLogArrayData);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
