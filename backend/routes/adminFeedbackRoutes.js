import express from 'express';
import {
    getAdminFeedbackList,
    updateFeedbackStatus,
    addAdminResponse,
    adminDeleteFeedback,
    adminRestoreFeedback,
    getAdminFeedbackStats
} from '../controllers/feedbackController.js';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';
import { roleCheckMiddleware } from '../middlewares/roleCheckMiddleware.js';

const router = express.Router();

// Protect all admin feedback routes
router.use(verifyAccessTokenMiddleware, roleCheckMiddleware);

router.get('/', getAdminFeedbackList);
router.get('/stats', getAdminFeedbackStats);
router.patch('/:id/status', updateFeedbackStatus);
router.patch('/:id/response', addAdminResponse);
router.delete('/:id', adminDeleteFeedback);
router.post('/:id/restore', adminRestoreFeedback);

export default router;

