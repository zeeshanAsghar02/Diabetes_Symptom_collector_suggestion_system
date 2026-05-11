// backend/models/Permission.js
import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    resource: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    scope: {
        type: String,
        required: true
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

export const Permission = mongoose.model('Permission', permissionSchema);