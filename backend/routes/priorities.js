import express from 'express';
import { generateWeeklyPriorities } from '../controllers/prioritiesController.js';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Generate personalized weekly priorities using LLM + RAG
router.get('/weekly', verifyAccessTokenMiddleware, generateWeeklyPriorities);

export default router;
