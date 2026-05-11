import express from 'express';
import { completeChat, getChatHistory, clearChatHistory } from '../controllers/chatController.js';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyAccessTokenMiddleware);

router.post('/send', completeChat);
router.get('/history', getChatHistory);
router.delete('/history', clearChatHistory);

export default router;
