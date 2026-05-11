import mongoose from 'mongoose';

const dietPlanSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  target_date: { 
    type: Date, 
    required: true 
  }, // The day this plan is FOR
  
  region: { 
    type: String, 
    required: true 
  }, // e.g., 'Pakistan', 'India', 'Global'
  
  total_calories: { 
    type: Number, 
    required: true 
  },
  
  meals: [{
    name: { 
      type: String, 
      required: true 
    }, // 'Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'
    
    timing: { 
      type: String 
    }, // '7:00 AM - 9:00 AM'
    
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
    }
  }],
  
  nutritional_totals: {
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
  },
  
  sources: [{ // RAG document sources
    title: String,
    country: String,
    doc_type: String
  }],
  
  tips: [String], // AI-generated personalized tips
  
  // Future glucose integration
  glucose_context: {
    fasting: { 
      type: Number 
    },
    post_meal_avg: { 
      type: Number 
    },
    readings_used: { 
      type: Number, 
      default: 0 
    }
  },
  
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'skipped'],
    default: 'pending'
  },
  
  generated_at: { 
    type: Date, 
    default: Date.now 
  },
  
  followed: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

// Compound index: one plan per user per date
dietPlanSchema.index({ user_id: 1, target_date: 1 }, { unique: true });

// Index for querying user's plans
dietPlanSchema.index({ user_id: 1, target_date: -1 });

// Index for finding active plans
dietPlanSchema.index({ user_id: 1, status: 1 });

export default mongoose.model('DietPlan', dietPlanSchema);
