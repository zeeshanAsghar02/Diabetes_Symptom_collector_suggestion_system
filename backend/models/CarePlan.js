const mongoose = require('mongoose');

const CarePlanSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  plan_type: {
    type: String,
    enum: ['initial', 'maintenance', 'adjustment'],
    default: 'initial'
  },
  diabetes_type: {
    type: String,
    required: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active',
    index: true
  },
  
  // Monthly goals
  monthly_goals: {
    hba1c_target: Number,
    weight_goal: Number,
    activity_minutes_weekly: Number,
    habit_consistency_target: Number // percentage
  },
  
  // Weekly breakdown
  weekly_plans: [{
    week_number: {
      type: Number,
      min: 1,
      max: 4
    },
    weekly_focus: String,
    diet_plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MonthlyDietPlan'
    },
    exercise_plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MonthlyExercisePlan'
    },
    habit_targets: [{
      habit_id: String,
      target_completions: Number // out of 7 days
    }],
    weekly_goals: {
      diet_consistency: Number,
      exercise_completion: Number,
      habit_consistency: Number
    }
  }],
  
  // Generated recommendations and context
  generation_context: {
    user_profile_snapshot: mongoose.Schema.Types.Mixed,
    rag_sources: [{
      title: String,
      country: String,
      doc_type: String
    }],
    llm_model: String,
    generated_at: Date
  },
  
  // Progress tracking
  progress: {
    overall_completion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    diet_adherence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    exercise_adherence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    habit_adherence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    weekly_progress: [{
      week_number: Number,
      completion_percentage: Number,
      notes: String
    }]
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
CarePlanSchema.index({ user_id: 1, status: 1 });
CarePlanSchema.index({ user_id: 1, start_date: -1 });

// Instance method to check if plan is currently active
CarePlanSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         this.start_date <= now && 
         this.end_date >= now;
};

// Instance method to get current week number
CarePlanSchema.methods.getCurrentWeek = function() {
  const now = new Date();
  const startDate = new Date(this.start_date);
  const diffTime = now - startDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(Math.ceil(diffDays / 7), 4);
};

// Static method to find active plan for user
CarePlanSchema.statics.findActiveForUser = function(userId) {
  return this.findOne({
    user_id: userId,
    status: 'active',
    start_date: { $lte: new Date() },
    end_date: { $gte: new Date() }
  });
};

module.exports = mongoose.model('CarePlan', CarePlanSchema);