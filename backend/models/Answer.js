import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
    answer_text: { type: String, required: true },
    deleted_at: { type: Date, default: null },
}, { timestamps: true });

export const Answer = mongoose.model("Answer", answerSchema); 