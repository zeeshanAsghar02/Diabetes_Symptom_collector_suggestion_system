



import mongoose from 'mongoose';

const usersActionsSchema = new mongoose.Schema({
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
    action_type: {
        type: String,
        required: true,
    },
    action_timestamp: {
        type: Date,
        required: true,
    },
    deleted_at: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

export const UsersActions = mongoose.model('Users_Actions', usersActionsSchema);