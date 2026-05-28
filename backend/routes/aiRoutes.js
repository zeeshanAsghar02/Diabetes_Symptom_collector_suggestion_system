import express from 'express';
import { generateAIResponse } from '../controllers/aiController.js';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';
import { apiLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

router.post('/generate', apiLimiter, verifyAccessTokenMiddleware, generateAIResponse);

export default router;
