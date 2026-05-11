import express from 'express';
import {
    scheduleMedicationReminder,
    scheduleAppointmentReminder,
} from '../controllers/notificationController.js';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protected routes
router.post('/schedule/medication', verifyAccessTokenMiddleware, scheduleMedicationReminder);
router.post('/schedule/appointment', verifyAccessTokenMiddleware, scheduleAppointmentReminder);


export default router;
