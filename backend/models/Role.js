


import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
    role_name: {
        type: String,
        required: true,
    },
    deleted_at: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

export const Role = mongoose.model('Role', roleSchema);