import mongoose from 'mongoose';

const HabitSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  habit_id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    enum: ['sleep', 'nutrition', 'activity', 'monitoring', 'stress', 'medication'],
    required: true
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    required: true
  },
  
  // Customization based on user profile
  target_frequency: {
    type: String,
    default: 'daily'
  },
  target_description: {
    type: String
  },
  diabetes_relevance: {
    type: String
  },
  
  // Configuration
  icon: String,
  color: String,
  
  // Tracking
  active: {
    type: Boolean,
    default: true
  },
  start_date: {
    type: Date,
    default: Date.now
  },
  daily_completions: [{
    date: {
      type: Date,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    notes: String
  }],
  
  // Streaks and progress (computed fields, updated by methods)
  current_streak: {
    type: Number,
    default: 0
  },
  longest_streak: {
    type: Number,
    default: 0
  },
  completion_rate_30d: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for user habits
HabitSchema.index({ user_id: 1, habit_id: 1 }, { unique: true });
HabitSchema.index({ user_id: 1, active: 1 });

// Instance method to mark completion for a specific date
HabitSchema.methods.markCompletion = function(date, completed = true, notes = '') {
  const dateStr = new Date(date).toISOString().split('T')[0];
  const existingIndex = this.daily_completions.findIndex(
    completion => completion.date.toISOString().split('T')[0] === dateStr
  );
  
  if (existingIndex >= 0) {
    this.daily_completions[existingIndex].completed = completed;
    this.daily_completions[existingIndex].notes = notes;
  } else {
    this.daily_completions.push({
      date: new Date(date),
      completed,
      notes
    });
  }
  
  // Sort by date
  this.daily_completions.sort((a, b) => a.date - b.date);
  
  // Recalculate streaks and completion rate
  this.updateStreaks();
  this.updateCompletionRate();
  
  return this.save();
};

// Instance method to calculate current and longest streaks
HabitSchema.methods.updateStreaks = function() {
  if (this.daily_completions.length === 0) {
    this.current_streak = 0;
    this.longest_streak = 0;
    return;
  }
  
  // Sort completions by date (newest first)
  const completions = [...this.daily_completions]
    .sort((a, b) => b.date - a.date);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Calculate current streak (from today backwards)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < completions.length; i++) {
    const completionDate = new Date(completions[i].date);
    completionDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    if (completionDate.getTime() === expectedDate.getTime() && completions[i].completed) {
      currentStreak++;
    } else if (i === 0 && completionDate.getTime() < expectedDate.getTime()) {
      // No completion for today, current streak is 0
      currentStreak = 0;
      break;
    } else {
      break;
    }
  }
  
  // Calculate longest streak
  for (const completion of completions) {
    if (completion.completed) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  this.current_streak = currentStreak;
  this.longest_streak = longestStreak;
};

// Instance method to calculate 30-day completion rate
HabitSchema.methods.updateCompletionRate = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentCompletions = this.daily_completions.filter(
    completion => completion.date >= thirtyDaysAgo
  );
  
  if (recentCompletions.length === 0) {
    this.completion_rate_30d = 0;
    return;
  }
  
  const completedCount = recentCompletions.filter(
    completion => completion.completed
  ).length;
  
  this.completion_rate_30d = Math.round((completedCount / recentCompletions.length) * 100);
};

// Instance method to get completion status for a specific date
HabitSchema.methods.getCompletionForDate = function(date) {
  const dateStr = new Date(date).toISOString().split('T')[0];
  const completion = this.daily_completions.find(
    completion => completion.date.toISOString().split('T')[0] === dateStr
  );
  return completion ? completion.completed : false;
};

// Instance method to get weekly completions (last 7 days)
HabitSchema.methods.getWeeklyCompletions = function() {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  
  const weeklyCompletions = this.daily_completions.filter(
    completion => completion.date >= sevenDaysAgo && completion.completed
  );
  
  return weeklyCompletions.length;
};

// Static method to find active habits for user
HabitSchema.statics.findActiveForUser = function(userId) {
  return this.find({
    user_id: userId,
    active: true
  }).sort({ priority: 1, created_at: 1 });
};

// Static method to create default habits based on diabetes type
HabitSchema.statics.createDefaultHabits = function(userId, diabetesType, personalProfile) {
  const defaultHabits = [
    {
      habit_id: 'sleep-schedule',
      title: 'Maintain consistent sleep schedule',
      description: 'Go to bed and wake up at the same time daily',
      category: 'sleep',
      priority: 'high',
      target_description: 'Sleep 7-8 hours, same schedule daily',
      diabetes_relevance: 'Consistent sleep helps regulate blood sugar and insulin sensitivity',
      icon: 'BedtimeIcon',
      color: '#6366f1'
    },
    {
      habit_id: 'post-meal-walk',
      title: 'Take a post-meal walk',
      description: '10-15 minute walk after main meals',
      category: 'activity',
      priority: 'high',
      target_description: 'Walk after breakfast, lunch, or dinner',
      diabetes_relevance: 'Post-meal activity helps control blood sugar spikes',
      icon: 'DirectionsWalkIcon',
      color: '#10b981'
    },
    {
      habit_id: 'hydration',
      title: 'Stay well hydrated',
      description: 'Drink water regularly throughout the day',
      category: 'nutrition',
      priority: 'medium',
      target_description: '8-10 glasses of water daily',
      diabetes_relevance: 'Proper hydration supports kidney function and glucose control',
      icon: 'LocalDrinkIcon',
      color: '#06b6d4'
    },
    {
      habit_id: 'stress-pause',
      title: 'Take stress breaks',
      description: '5-minute breathing or mindfulness breaks',
      category: 'stress',
      priority: 'medium',
      target_description: '2-3 stress breaks per day',
      diabetes_relevance: 'Stress management helps prevent blood sugar fluctuations',
      icon: 'SelfImprovementIcon',
      color: '#8b5cf6'
    }
  ];
  
  // Add diabetes-type specific habits
  if (diabetesType === 'Type 1') {
    defaultHabits.push({
      habit_id: 'glucose-monitoring',
      title: 'Monitor blood glucose as scheduled',
      description: 'Check glucose levels before meals and bedtime',
      category: 'monitoring',
      priority: 'high',
      target_description: 'Check as recommended by doctor',
      diabetes_relevance: 'Essential for insulin dosing and preventing complications',
      icon: 'MonitorHeartIcon',
      color: '#f59e0b'
    });
  }
  
  if (diabetesType === 'Type 2') {
    defaultHabits.push({
      habit_id: 'portion-awareness',
      title: 'Practice portion control',
      description: 'Use plate method or measuring for consistent portions',
      category: 'nutrition',
      priority: 'high',
      target_description: 'Consistent portions at each meal',
      diabetes_relevance: 'Portion control is key for weight management and glucose control',
      icon: 'FavoriteIcon',
      color: '#ec4899'
    });
  }
  
  // Create habits for user
  const habitsToCreate = defaultHabits.map(habit => ({
    user_id: userId,
    ...habit
  }));
  
  return Habit.insertMany(habitsToCreate);
};

const Habit = mongoose.model('Habit', HabitSchema);
export { Habit };
