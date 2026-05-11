import mongoose from "mongoose";

const usersAnswersSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    question_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
    },
    answer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Answer",
        required: true,
    },
    deleted_at: { type: Date, default: null },
}, { timestamps: true });

export const UsersAnswers = mongoose.model("Users_Answers", usersAnswersSchema); 