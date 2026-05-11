import mongoose from 'mongoose';

const ExerciseItemSchema = new mongoose.Schema({
  exercise: { type: String, required: true },
  category: { type: String, required: true },
  duration_min: { type: Number, required: true },
  intensity: { type: String, required: true },
  mets: { type: Number },
  estimated_calories: { type: Number },
  heart_rate_zone: { type: String },
  notes: { type: String },
  precautions: { type: [String], default: [] }
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  time: { type: String },
  type: { type: String, default: 'any' },
  items: { type: [ExerciseItemSchema], default: [] },
  total_duration_min: { type: Number, default: 0 },
  total_estimated_calories: { type: Number, default: 0 }
}, { _id: false });

const SourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  country: { type: String, default: 'Global' },
  doc_type: { type: String, default: 'exercise_recommendation' }
}, { _id: false });

const ExercisePlanSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  target_date: { type: Date, required: true, index: true },
  region: { type: String, default: 'Global' },
  sessions: { type: [SessionSchema], default: [] },
  totals: {
    duration_total_min: { type: Number, default: 0 },
    calories_total: { type: Number, default: 0 },
    sessions_count: { type: Number, default: 0 }
  },
  sources: { type: [SourceSchema], default: [] },
  tips: { type: [String], default: [] },
  status: { type: String, enum: ['pending', 'final'], default: 'pending' },
  // Async generation tracking (fire-and-forget pattern, mirrors MonthlyDietPlan)
  generation_status: { type: String, enum: ['pending', 'complete', 'failed'], default: 'pending' },
  generation_error: { type: String },
  generated_at: { type: Date, default: Date.now }
}, { timestamps: true });

ExercisePlanSchema.index({ user_id: 1, target_date: 1 }, { unique: true });

const ExercisePlan = mongoose.model('ExercisePlan', ExercisePlanSchema);
export default ExercisePlan;
