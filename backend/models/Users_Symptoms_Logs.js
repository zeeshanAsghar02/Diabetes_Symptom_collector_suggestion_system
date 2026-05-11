import mongoose from "mongoose";

const usersSymptomsLogsSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    symptom_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Symptom',
        required: true
    },
    log_date: { type: Date, required: true },
    intensity: { type: String },
    notes: { type: String },
    deleted_at: { type: Date, default: null },
}, { timestamps: true });

export const UsersSymptomsLogs = mongoose.model('Users_Symptoms_Logs', usersSymptomsLogsSchema);
  