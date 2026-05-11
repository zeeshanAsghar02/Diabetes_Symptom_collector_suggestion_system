// backend/models/RolePermissions.js
import mongoose from 'mongoose';

const rolePermissionsSchema = new mongoose.Schema({
    role_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    permission_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
        required: true
    },
    assigned_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assigned_at: {
        type: Date,
        default: Date.now
    },
    is_active: {
        type: Boolean,
        default: true
    },
    deleted_at: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Unique compound index to prevent duplicate role-permission assignments
rolePermissionsSchema.index({ role_id: 1, permission_id: 1 }, { unique: true });

export const RolePermissions = mongoose.model('RolePermissions', rolePermissionsSchema);