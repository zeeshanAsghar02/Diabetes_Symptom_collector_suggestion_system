import express from 'express';
import authRoute from './authRoute.js';
import lifestyleTipsRoutes from './lifestyleTipsRoutes.js';
import habitsRoutes from './habitsRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';
import healthRoutes from './healthRoutes.js';
import monthlyDietPlanRoutes from './monthlyDietPlanRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const router = express.Router();

router.use('/auth', authRoute);
router.use('/lifestyle-tips', lifestyleTipsRoutes);
router.use('/habits', habitsRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/health', healthRoutes);
router.use('/monthly-diet-plan', monthlyDietPlanRoutes);
router.use('/notifications', notificationRoutes);

export default router;