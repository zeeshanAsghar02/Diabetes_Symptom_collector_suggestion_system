// Backend Model Design for Monthly Care Plans
// This file documents the planned backend changes to support monthly plans instead of daily generation

/* 
NEW MODELS TO ADD:

1. CarePlan.js - Monthly care plan with weekly breakdown
2. CheckIn.js - Daily/weekly user check-ins for plan adjustment
3. Habit.js - Individual habit tracking with user-specific customization
4. MonthlyDietPlan.js - Extension of DietPlan for monthly structure
5. MonthlyExercisePlan.js - Extension of ExercisePlan for monthly structure

NEW ENDPOINTS TO ADD:

Care Plan Management:
- POST /api/v1/care-plan/generate - Generate monthly care plan
- GET /api/v1/care-plan/current - Get active care plan
- PUT /api/v1/care-plan/:id/adjust - Adjust plan based on check-ins
- DELETE /api/v1/care-plan/:id - Archive old plan

Monthly Diet Plans:
- POST /api/v1/diet-plan/monthly/generate - Generate monthly diet framework
- GET /api/v1/diet-plan/monthly/current - Get current monthly plan
- PUT /api/v1/diet-plan/monthly/select-options - User selects daily options
- GET /api/v1/diet-plan/monthly/week/:weekNumber - Get specific week

Monthly Exercise Plans:
- POST /api/v1/exercise-plan/monthly/generate - Generate monthly exercise program
- GET /api/v1/exercise-plan/monthly/current - Get current monthly plan  
- PUT /api/v1/exercise-plan/monthly/progress - Log exercise completion
- GET /api/v1/exercise-plan/monthly/week/:weekNumber - Get specific week

Habit Tracking:
- POST /api/v1/habits/generate - Generate personalized habits based on profile
- GET /api/v1/habits/current - Get active habits
- PUT /api/v1/habits/:id/toggle - Toggle daily habit completion
- GET /api/v1/habits/progress/weekly - Get weekly habit progress

Check-ins:
- POST /api/v1/check-in/daily - Submit daily check-in
- POST /api/v1/check-in/weekly - Submit weekly review
- GET /api/v1/check-in/history - Get check-in history
- GET /api/v1/check-in/insights - Get patterns and insights

Priority Detection:
- GET /api/v1/priorities/current - Get current top 3 priorities
- POST /api/v1/priorities/detect - Run priority detection based on latest data

EXISTING ENDPOINTS TO KEEP:
- All current daily generation endpoints remain functional
- New monthly system runs in parallel
- Users can access both approaches through different UI paths

*/

// 1. CarePlan Model Schema
const CarePlanSchema = {
  user_id: 'ObjectId, ref: User',
  plan_type: 'String, enum: ["initial", "maintenance", "adjustment"], default: "initial"',
  diabetes_type: 'String, required: true', // Type 1, Type 2, Gestational, etc.
  start_date: 'Date, required: true',
  end_date: 'Date, required: true', // 4 weeks from start
  status: 'String, enum: ["active", "completed", "archived"], default: "active"',
  
  // Monthly goals
  monthly_goals: {
    hba1c_target: 'Number', // if available
    weight_goal: 'Number',
    activity_minutes_weekly: 'Number',
    habit_consistency_target: 'Number', // percentage
  },
  
  // Weekly breakdown
  weekly_plans: [{
    week_number: 'Number, min: 1, max: 4',
    weekly_focus: 'String', // e.g., "Building routine", "Increasing intensity"
    diet_plan_id: 'ObjectId, ref: MonthlyDietPlan',
    exercise_plan_id: 'ObjectId, ref: MonthlyExercisePlan',
    habit_targets: [{
      habit_id: 'String',
      target_completions: 'Number' // out of 7 days
    }],
    weekly_goals: {
      diet_consistency: 'Number',
      exercise_completion: 'Number',
      habit_consistency: 'Number'
    }
  }],
  
  // Generated recommendations and context
  generation_context: {
    user_profile_snapshot: 'Mixed', // Snapshot of user data when generated
    rag_sources: [{ title: 'String', country: 'String', doc_type: 'String' }],
    llm_model: 'String',
    generated_at: 'Date'
  },
  
  // Progress tracking
  progress: {
    overall_completion: 'Number', // 0-100%
    diet_adherence: 'Number',
    exercise_adherence: 'Number', 
    habit_adherence: 'Number',
    weekly_progress: [{
      week_number: 'Number',
      completion_percentage: 'Number',
      notes: 'String'
    }]
  }
};

// 2. CheckIn Model Schema  
const CheckInSchema = {
  user_id: 'ObjectId, ref: User',
  care_plan_id: 'ObjectId, ref: CarePlan',
  type: 'String, enum: ["daily", "weekly"], required: true',
  date: 'Date, required: true',
  
  // Daily check-in fields
  daily_data: {
    energy_level: 'Number, min: 1, max: 5', // 1=very low, 5=very high
    mood: 'Number, min: 1, max: 5',
    sleep_quality: 'Number, min: 1, max: 5',
    appetite: 'String, enum: ["poor", "normal", "increased"]',
    glucose_readings: [{
      time: 'String', // "fasting", "post_breakfast", etc.
      value: 'Number',
      unit: 'String, default: "mg/dL"'
    }],
    completed_habits: ['String'], // habit IDs completed today
    adherence: {
      diet_plan: 'Boolean',
      exercise_plan: 'Boolean',
      medications: 'Boolean'
    },
    notes: 'String'
  },
  
  // Weekly check-in fields
  weekly_data: {
    overall_satisfaction: 'Number, min: 1, max: 5',
    plan_difficulty: 'Number, min: 1, max: 5', // 1=too easy, 5=too hard
    barriers_encountered: ['String'], // predefined options + custom
    what_worked_well: 'String',
    what_was_challenging: 'String',
    goals_for_next_week: 'String',
    request_plan_changes: 'Boolean',
    suggested_changes: 'String'
  },
  
  // System analysis
  insights: {
    patterns_detected: ['String'],
    recommendations: ['String'],
    priority_changes: ['String'],
    requires_plan_adjustment: 'Boolean'
  }
};

// 3. MonthlyDietPlan Model Schema (extends existing DietPlan)
const MonthlyDietPlanSchema = {
  user_id: 'ObjectId, ref: User',
  care_plan_id: 'ObjectId, ref: CarePlan',
  month_year: 'String', // "2026-01"
  diabetes_type: 'String, required: true',
  region: 'String, required: true',
  
  // Monthly framework
  monthly_structure: {
    daily_calories_target: 'Number',
    meal_timing_strategy: 'String', // "3-meals-2-snacks", "intermittent-fasting", etc.
    carb_distribution: {
      breakfast_percent: 'Number',
      lunch_percent: 'Number', 
      dinner_percent: 'Number',
      snacks_percent: 'Number'
    }
  },
  
  // Weekly meal rotation options
  weekly_options: [{
    week_number: 'Number, min: 1, max: 4',
    meal_library: {
      breakfast: [{
        option_id: 'String',
        name: 'String',
        ingredients: ['String'],
        calories: 'Number',
        carbs: 'Number',
        protein: 'Number',
        fat: 'Number',
        prep_time_min: 'Number',
        cultural_notes: 'String'
      }],
      lunch: [{ /* same structure */ }],
      dinner: [{ /* same structure */ }],
      snacks: [{ /* same structure */ }]
    }
  }],
  
  // User selections (what they actually choose daily)
  daily_selections: [{
    date: 'Date',
    selected_meals: {
      breakfast: 'String', // option_id
      lunch: 'String',
      dinner: 'String',
      morning_snack: 'String',
      evening_snack: 'String'
    },
    actual_consumption: {
      meals_completed: ['String'], // which meals they actually ate
      portion_adherence: 'String', // "followed", "smaller", "larger"
      notes: 'String'
    }
  }],
  
  // RAG context and generation info
  sources: [{ title: 'String', country: 'String', doc_type: 'String' }],
  generation_context: 'Mixed',
  created_at: 'Date',
  updated_at: 'Date'
};

// 4. MonthlyExercisePlan Model Schema (extends existing ExercisePlan)
const MonthlyExercisePlanSchema = {
  user_id: 'ObjectId, ref: User',
  care_plan_id: 'ObjectId, ref: CarePlan', 
  month_year: 'String',
  diabetes_type: 'String, required: true',
  region: 'String, required: true',
  
  // Monthly progression structure
  monthly_program: {
    fitness_level: 'String, enum: ["beginner", "intermediate", "advanced"]',
    weekly_targets: [{
      week_number: 'Number, min: 1, max: 4',
      total_minutes: 'Number',
      frequency_days: 'Number',
      intensity_focus: 'String', // "endurance", "strength", "flexibility", "mixed"
      progression_note: 'String'
    }]
  },
  
  // Weekly exercise libraries
  weekly_programs: [{
    week_number: 'Number, min: 1, max: 4',
    daily_options: [{
      day_focus: 'String', // "cardio", "strength", "flexibility", "rest", "active-recovery"
      session_options: [{
        option_id: 'String',
        name: 'String',
        duration_min: 'Number',
        intensity: 'String',
        exercises: [{
          exercise: 'String',
          duration_or_reps: 'String',
          rest_time: 'String',
          modifications: ['String'], // easier/harder variations
          diabetes_notes: 'String' // specific diabetes considerations
        }],
        equipment_needed: ['String'],
        calories_estimate: 'Number',
        safety_notes: ['String']
      }]
    }]
  }],
  
  // Daily user activity logs
  daily_logs: [{
    date: 'Date',
    planned_session: 'String', // option_id that was planned
    actual_session: {
      completed: 'Boolean',
      session_id: 'String', // which option they did (might be different)
      duration_actual: 'Number',
      intensity_felt: 'String, enum: ["light", "moderate", "vigorous"]',
      enjoyment: 'Number, min: 1, max: 5',
      glucose_before: 'Number',
      glucose_after: 'Number',
      notes: 'String'
    }
  }],
  
  sources: [{ title: 'String', country: 'String', doc_type: 'String' }],
  generation_context: 'Mixed',
  created_at: 'Date',
  updated_at: 'Date'
};

// 5. Habit Model Schema
const HabitSchema = {
  user_id: 'ObjectId, ref: User', 
  habit_id: 'String, required: true', // unique identifier
  title: 'String, required: true',
  description: 'String',
  category: 'String, enum: ["sleep", "nutrition", "activity", "monitoring", "stress", "medication"]',
  priority: 'String, enum: ["high", "medium", "low"]',
  
  // Customization based on user profile
  target_frequency: 'String', // "daily", "3-times-week", etc.
  target_description: 'String', // specific target for this user
  diabetes_relevance: 'String', // why this matters for their diabetes type
  
  // Tracking
  active: 'Boolean, default: true',
  start_date: 'Date',
  daily_completions: [{
    date: 'Date',
    completed: 'Boolean',
    notes: 'String'
  }],
  
  // Streaks and progress
  current_streak: 'Number, default: 0',
  longest_streak: 'Number, default: 0',
  completion_rate_30d: 'Number', // percentage over last 30 days
  
  created_at: 'Date',
  updated_at: 'Date'
};

/* 
IMPLEMENTATION STRATEGY:

Phase 1: Backend Models & Basic Endpoints
- Create the 5 new models above
- Implement basic CRUD endpoints for each
- Add monthly diet/exercise generation using existing RAG architecture
- Keep all existing endpoints functioning

Phase 2: Priority Detection & Check-ins
- Implement priority detection service using user profile + check-in data  
- Add check-in endpoints with basic analysis
- Connect check-ins to plan adjustments

Phase 3: Frontend Monthly Views
- Update diet/exercise pages to show monthly view with weekly breakdown
- Add habit management interface
- Implement check-in forms and progress views

Phase 4: Advanced Features
- Automatic plan adjustment based on check-in patterns
- Enhanced RAG queries for monthly/progressive content
- Integration with glucose data when IoT devices are added

This approach allows gradual migration from daily to monthly planning while maintaining all current functionality.
*/

module.exports = {
  CarePlanSchema,
  CheckInSchema, 
  MonthlyDietPlanSchema,
  MonthlyExercisePlanSchema,
  HabitSchema
};