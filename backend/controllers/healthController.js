import * as healthService from '../services/healthService.js';

export const getHealthSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const summary = await healthService.getHealthSummary(userId);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get health summary.' });
  }
};

export const getHealthHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { metricType } = req.params;
    const history = await healthService.getHealthHistory(userId, metricType);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get health history.' });
  }
};

export const logHealthMetric = async (req, res) => {
  try {
    const userId = req.user._id;
    const metric = req.body;
    const newMetric = await healthService.logHealthMetric(userId, metric);
    res.status(201).json({ success: true, data: newMetric });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
