import mongoose from 'mongoose';

const healthMetricSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'blood_glucose', 'hba1c', 'blood_pressure', 'weight',
      'steps', 'distance', 'calories_burned', 'sleep_time', 'heart_rate',
    ],
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

// Compound index for efficient querying
healthMetricSchema.index({ user_id: 1, type: 1, timestamp: -1 });

const HealthMetric = mongoose.model('HealthMetric', healthMetricSchema);

export default HealthMetric;
