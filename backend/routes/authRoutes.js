import { Router } from 'express';
import { resetPassword, forgotPassword, verifyToken, changePassword } from './authController.js';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', verifyToken);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', verifyAccessTokenMiddleware, changePassword);

export default router;