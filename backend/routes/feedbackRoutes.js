import express from 'express';
import {
    getAllFeedback,
    getFeedbackStats,
    getMyFeedback,
    submitFeedback,
    updateFeedback,
    deleteFeedback
} from '../controllers/feedbackController.js';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllFeedback);
router.get('/stats', getFeedbackStats);

// Protected routes (require authentication)
router.get('/my-feedback', verifyAccessTokenMiddleware, getMyFeedback);
router.post('/', verifyAccessTokenMiddleware, submitFeedback);
router.put('/:id', verifyAccessTokenMiddleware, updateFeedback);
router.delete('/:id', verifyAccessTokenMiddleware, deleteFeedback);

export default router;

