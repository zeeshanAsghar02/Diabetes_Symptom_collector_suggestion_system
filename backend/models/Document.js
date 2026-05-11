import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    doc_id: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    original_filename: {
        type: String,
        required: true,
    },
    checksum: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
    },
    source: {
        type: String,
        required: true,
        trim: true,
    },
    country: {
        type: String,
        required: true,
        trim: true,
    },
    doc_type: {
        type: String,
        required: true,
        enum: ['guideline', 'research_paper', 'diet_chart', 'exercise_recommendation', 'clinical_material', 'other'],
    },
    version: {
        type: String,
        default: '1.0',
    },
    original_path: {
        type: String,
        required: true,
    },
    text_path: {
        type: String,
        required: true,
    },
    page_count: {
        type: Number,
        default: 0,
    },
    chunk_count: {
        type: Number,
        default: 0,
    },
    ingested_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    ingested_on: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'ingested', 'failed'],
        default: 'pending',
    },
    error_message: {
        type: String,
    },
}, { timestamps: true });

// Indexes for efficient querying
documentSchema.index({ doc_type: 1, country: 1 });
documentSchema.index({ ingested_by: 1, ingested_on: -1 });
documentSchema.index({ status: 1 });

export const Document = mongoose.model('Document', documentSchema);
