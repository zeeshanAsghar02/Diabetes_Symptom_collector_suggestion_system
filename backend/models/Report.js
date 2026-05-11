import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    assessment_type: {
        type: String,
        enum: ['diabetes', 'diet', 'exercise', 'lifestyle'],
        default: 'diabetes',
        required: true,
        index: true,
    },
    risk_level: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true,
    },
    probability: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1,
    },
    features: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
    },
    ml_results: {
        type: mongoose.Schema.Types.Mixed,
    },
    answer_hash: {
        type: String,
        required: true,
        index: true,
    },
    answer_ids: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true,
    },
    pdf_path: {
        type: String,
    },
    email_sent_at: {
        type: Date,
        default: null,
    },
    assessment_date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    generated_on: { 
        type: Date, 
        required: true,
        default: Date.now,
    },
    summary: { type: String },
    risk_score: { type: Number },
    deleted_at: { type: Date, default: null },
}, { timestamps: true });

// Index for efficient querying of user's assessment history
reportSchema.index({ user_id: 1, assessment_type: 1, assessment_date: -1, deleted_at: 1 });

export const Report = mongoose.model("Report", reportSchema); 