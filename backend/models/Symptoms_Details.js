import mongoose from "mongoose";

const symptomsDetailsSchema = new mongoose.Schema({
    symptom_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Symptom",
        required: true,
    },
    risk_level: { type: String },
    deleted_at: { type: Date, default: null },
}, { timestamps: true });

export const SymptomsDetails = mongoose.model("Symptoms_Details", symptomsDetailsSchema); 