import mongoose from 'mongoose';

const habitItemSchema = new mongoose.Schema({
  id: String,
  category: {
    type: String,
    enum: ['diet', 'exercise', 'medication', 'lifestyle', 'monitoring', 'sleep', 'stress'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  targetValue: String,
  unit: String,
  frequency: {
    type: String,
    enum: ['daily', 'multiple_times_daily', 'weekly', 'as_needed'],
    default: 'daily'
  },
  timeOfDay: [String], // e.g., ['morning', 'afternoon', 'evening', 'night']
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  medicalReason: String,
  tips: [String]
});

const dailyProgressSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  habitId: String,
  completed: {
    type: Boolean,
    default: false
  },
  actualValue: String,
  notes: String,
  completedAt: Date
});

const weeklyHabitsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  weekStartDate: {
    type: Date,
    required: true,
    index: true
  },
  weekEndDate: {
    type: Date,
    required: true
  },
  habits: [habitItemSchema],
  progress: [dailyProgressSchema],
  generatedAt: {
    type: Date,
    default: Date.now
  },
  generationContext: {
    bmi: Number,
    diabetesType: String,
    diabetesDuration: Number,
    activityLevel: String,
    medications: [String],
    chronicConditions: [String]
  },
  llmMetadata: {
    model: String,
    ragContextUsed: Boolean,
    sources: [String]
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  }
}, { timestamps: true });

// Index for efficient querying
weeklyHabitsSchema.index({ user_id: 1, weekStartDate: -1 });
weeklyHabitsSchema.index({ user_id: 1, status: 1 });

// Method to check if week is expired
weeklyHabitsSchema.methods.isExpired = function() {
  return new Date() > this.weekEndDate;
};

// Method to get completion rate
weeklyHabitsSchema.methods.getCompletionRate = function() {
  if (this.progress.length === 0) return 0;
  const completed = this.progress.filter(p => p.completed).length;
  const total = this.habits.length * 7; // 7 days per week
  return Math.round((completed / total) * 100);
};

export const WeeklyHabits = mongoose.model('WeeklyHabits', weeklyHabitsSchema);
