import HealthMetric from '../models/HealthMetric.js';

export const getHealthSummary = async (userId) => {
  const metricTypes = [
    'blood_glucose', 'hba1c', 'blood_pressure', 'weight',
    'steps', 'distance', 'calories_burned', 'sleep_time', 'heart_rate',
  ];
  const summary = {};

  for (const type of metricTypes) {
    const latestMetric = await HealthMetric.findOne({ user_id: userId, type })
      .sort({ timestamp: -1 })
      .lean();
    if (latestMetric) {
      summary[type] = latestMetric;
    }
  }
  return summary;
};

export const getHealthHistory = async (userId, metricType) => {
  return HealthMetric.find({ user_id: userId, type: metricType })
    .sort({ timestamp: -1 })
    .limit(100) // Limit to recent 100 records for performance
    .lean();
};

export const logHealthMetric = async (userId, metricData) => {
  const newMetric = new HealthMetric({
    ...metricData,
    user_id: userId,
  });
  await newMetric.save();
  return newMetric;
};
