import express from 'express';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';
import * as healthController from '../controllers/healthController.js';

const router = express.Router();

router.use(verifyAccessTokenMiddleware);

router.get('/summary', healthController.getHealthSummary);
router.get('/history/:metricType', healthController.getHealthHistory);
router.post('/log', healthController.logHealthMetric);

export default router;
