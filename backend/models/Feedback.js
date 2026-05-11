import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        default: null,
    },
    is_anonymous: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['published', 'hidden'],
        default: 'published',
    },
    admin_response: {
        type: String,
        default: null,
    },
    submitted_on: {
        type: Date,
        default: Date.now,
    },
    category_ratings: {
        type: Map,
        of: Number,
        default: undefined,
    },
    deleted_at: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

export const Feedback = mongoose.model("Feedback", feedbackSchema);

