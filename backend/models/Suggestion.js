import mongoose from "mongoose";

const suggestionSchema = new mongoose.Schema({
    type: { type: String, required: true },
    description: { type: String, required: true },
    created_by: { type: String, required: true },
    report_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report",
        required: true,
    },
    deleted_at: { type: Date, default: null },
}, { timestamps: true });

export const Suggestion = mongoose.model("Suggestion", suggestionSchema); 