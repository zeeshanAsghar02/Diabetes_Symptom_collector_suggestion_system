import express from 'express';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';
import * as lifestyleTipsController from '../controllers/lifestyleTipsController.js';

const router = express.Router();

// All routes require authentication
router.use(verifyAccessTokenMiddleware);

// Auto-generate lifestyle tips for today (legacy synchronous endpoint)
router.post('/auto-generate', lifestyleTipsController.autoGenerateLifestyleTips);
// Fire-and-forget: ensure today's tips exist (async, 202 + poll)
router.post('/ensure-today', lifestyleTipsController.ensureTodayLifestyleTips);
// Poll today's generation status
router.get('/status/today', lifestyleTipsController.getLifestyleTipsStatusToday);

// Generate lifestyle tips for a specific date
router.post('/generate', lifestyleTipsController.generateLifestyleTips);

// Get current day's tips
router.get('/current', lifestyleTipsController.getCurrentTips);

// Get tips for a specific date
router.get('/date/:date', lifestyleTipsController.getTipsByDate);

// Get tips history with limit
router.get('/history', lifestyleTipsController.getHistory);

// Get region coverage for lifestyle tips
router.get('/region-coverage', lifestyleTipsController.getRegionCoverage);

// Get user statistics
router.get('/stats', lifestyleTipsController.getUserStats);

// Get tips by ID
router.get('/:tipsId', lifestyleTipsController.getTipsById);

// Delete lifestyle tips
router.delete('/:tipsId', lifestyleTipsController.deleteLifestyleTips);

export default router;
