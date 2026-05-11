import mongoose from "mongoose";

const usersSuggestionsSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    suggestion_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Suggestion",
        required: true,
    },
    status: { type: String },
    assigned_on: { type: Date },
    deleted_at: { type: Date, default: null },
}, { timestamps: true });

export const UsersSuggestions = mongoose.model("Users_Suggestions", usersSuggestionsSchema); 