import mongoose from 'mongoose';

const lifestyleTipSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  target_date: {
    type: Date,
    required: true,
  },

  region: {
    type: String,
    required: true,
  },

  // Main content - categorized tips
  categories: [
    {
      name: {
        type: String,
        required: true,
      }, // 'sleep_hygiene', 'stress_management', etc.

      icon: String, // emoji identifier

      tips: [
        {
          title: String,
          description: String,
          priority: {
            type: String,
            enum: ['high', 'medium', 'low'],
            default: 'medium',
          },
        },
      ],
    },
  ],

  // Personalized recommendations based on profile
  personalized_insights: [String],

  // RAG document sources
  sources: [
    {
      title: String,
      country: String,
      doc_type: String, // 'lifestyle_guideline', 'diabetes_care_standard'
    },
  ],

  // Tracking
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active',
  },

  // Async generation tracking (fire-and-forget pattern, mirrors MonthlyDietPlan)
  generation_status: {
    type: String,
    enum: ['pending', 'complete', 'failed'],
    default: 'pending',
  },
  generation_error: { type: String },

  generated_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index - one set of tips per user per day
lifestyleTipSchema.index({ user_id: 1, target_date: 1 }, { unique: true });

const LifestyleTip = mongoose.model('LifestyleTip', lifestyleTipSchema);
export default LifestyleTip;
