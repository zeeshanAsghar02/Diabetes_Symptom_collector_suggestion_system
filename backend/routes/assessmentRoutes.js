import express from 'express';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';
import { assessDiabetes, getLatestDiabetesAssessment, getDiabetesAssessmentHistory, getNextQuestion, submitAnswer } from '../controllers/assessmentController.js';

const router = express.Router();

// Get next question for assessment
router.get('/next-question', verifyAccessTokenMiddleware, requirePermission('disease:view:own'), getNextQuestion);

// Submit an answer
router.post('/answer', verifyAccessTokenMiddleware, requirePermission('disease:edit:own'), submitAnswer);

// Get latest cached assessment (no model execution)
router.get('/diabetes/latest', verifyAccessTokenMiddleware, requirePermission('disease:view:own'), getLatestDiabetesAssessment);

// Get assessment history (all past assessments)
router.get('/diabetes/history', verifyAccessTokenMiddleware, requirePermission('disease:view:own'), getDiabetesAssessmentHistory);

// Run new assessment (or return cached if recent <24h, unless force_new=true)
router.post('/diabetes', verifyAccessTokenMiddleware, requirePermission('disease:view:own'), assessDiabetes);

export default router;




