import mongoose from 'mongoose';

/**
 * Monthly Diet Plan Model
 * Generates a month-long diet plan with multiple options per meal type
 * Unlike DietPlan (single day), this provides variety and flexibility
 */

const mealOptionSchema = new mongoose.Schema({
  option_name: {
    type: String,
    required: true
  }, // e.g., "Option 1", "Option 2"
  
  items: [{
    food: {
      type: String,
      required: true
    },
    portion: {
      type: String,
      required: true
    },
    calories: {
      type: Number,
      default: 0
    },
    carbs: {
      type: Number,
      default: 0
    },
    protein: {
      type: Number,
      default: 0
    },
    fat: {
      type: Number,
      default: 0
    },
    fiber: {
      type: Number,
      default: 0
    }
  }],
  
  total_calories: {
    type: Number,
    default: 0
  },
  
  description: {
    type: String
  }, // Optional brief description
  
  preparation_time: {
    type: String
  }, // e.g., "15 minutes"
  
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Moderate', 'Hard'],
    default: 'Easy'
  }
}, { _id: true });

const mealCategorySchema = new mongoose.Schema({
  meal_type: {
    type: String,
    required: true,
    enum: ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner']
  },
  
  timing: {
    type: String
  }, // e.g., "7:00 AM - 9:00 AM"
  
  target_calories: {
    type: Number,
    required: true
  }, // Target calories for this meal type
  
  options: [mealOptionSchema] // 5-7 options per meal type
}, { _id: false });

const monthlyDietPlanSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  }, // Month number (1-12)
  
  year: {
    type: Number,
    required: true
  },
  
  region: {
    type: String,
    required: true,
    default: 'Global'
  }, // e.g., 'Pakistan', 'India', 'Global'

  total_daily_calories: {
    type: Number,
    required: true,
    default: 0
  }, // Target daily calories

  // Async generation tracking — 'pending' while LLM is running, 'complete' when done
  generation_status: {
    type: String,
    enum: ['pending', 'complete', 'failed'],
    default: 'pending'
  },
  generation_error: { type: String },
  
  meal_categories: [mealCategorySchema], // 5 meal categories, each with 5-7 options
  
  nutritional_guidelines: {
    daily_carbs_range: {
      min: Number,
      max: Number
    },
    daily_protein_range: {
      min: Number,
      max: Number
    },
    daily_fat_range: {
      min: Number,
      max: Number
    },
    daily_fiber_target: {
      type: Number,
      default: 35
    }
  },
  
  sources: [{
    title: String,
    country: String,
    doc_type: String
  }], // RAG document sources
  
  tips: [String], // General monthly tips
  
  user_selections: [{
    date: {
      type: Date,
      required: true
    },
    selections: {
      breakfast: String, // option_name
      mid_morning_snack: String,
      lunch: String,
      evening_snack: String,
      dinner: String
    }
  }], // Track user's daily selections
  
  // Generation metadata
  generation_context: {
    user_profile_snapshot: {
      age: Number,
      gender: String,
      weight: Number,
      height: Number,
      activity_level: String,
      diabetes_type: String
    },
    llm_model: {
      type: String,
      default: 'diabetica-7b'
    },
    generated_at: {
      type: Date,
      default: Date.now
    },
    generation_duration_ms: Number
  },
  
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  
  created_at: {
    type: Date,
    default: Date.now
  },
  
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
monthlyDietPlanSchema.index({ user_id: 1, year: 1, month: 1 }, { unique: true });
monthlyDietPlanSchema.index({ user_id: 1, status: 1 });
monthlyDietPlanSchema.index({ user_id: 1, created_at: -1 });

// Pre-save middleware to update timestamps
monthlyDietPlanSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Instance method to get option by name
monthlyDietPlanSchema.methods.getMealOption = function(mealType, optionName) {
  const category = this.meal_categories.find(cat => cat.meal_type === mealType);
  if (!category) return null;
  
  return category.options.find(opt => opt.option_name === optionName);
};

// Instance method to calculate total options
monthlyDietPlanSchema.methods.getTotalOptions = function() {
  return this.meal_categories.reduce((sum, cat) => sum + cat.options.length, 0);
};

// Static method to get active plan for user
monthlyDietPlanSchema.statics.getActivePlan = async function(userId) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  return await this.findOne({
    user_id: userId,
    month: currentMonth,
    year: currentYear,
    status: 'active'
  });
};

export default mongoose.model('MonthlyDietPlan', monthlyDietPlanSchema);
