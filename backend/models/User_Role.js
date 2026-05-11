

import mongoose from 'mongoose';

const usersRolesSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    role_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true,
    },
    deleted_at: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

export const UsersRoles = mongoose.model('Users_Roles', usersRolesSchema);