import mongoose from "mongoose";

const symptomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    disease_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Disease",
        required: true,
    },
    deleted_at: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

export const Symptom = mongoose.model("Symptom", symptomSchema);
