import mongoose from "mongoose";

const diseaseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    symptoms_description: {
        type: String,
    },
    deleted_at: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

export const Disease = mongoose.model("Disease", diseaseSchema);