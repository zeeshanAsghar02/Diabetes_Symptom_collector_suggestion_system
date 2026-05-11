import mongoose from "mongoose";

const questionsAnswersSchema = new mongoose.Schema({
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

export const QuestionsAnswers = mongoose.model("Questions_Answers", questionsAnswersSchema); 