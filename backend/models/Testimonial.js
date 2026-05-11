import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    message: { type: String, required: true },
    approved: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
}, { timestamps: true });

export const Testimonial = mongoose.model("Testimonial", testimonialSchema); 