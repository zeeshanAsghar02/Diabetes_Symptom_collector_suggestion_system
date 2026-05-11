import express from 'express';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';
import { requirePermission, requireAnyPermission } from '../middlewares/permissionMiddleware.js';
import { getSymptomsByDisease, addSymptom, updateSymptom, deleteSymptom } from '../controllers/symptomController.js';

const router = express.Router();

// Public endpoint for onboarding - no authentication required
router.get('/public/:diseaseId', getSymptomsByDisease);

// Get all symptoms for a disease - requires either admin read or onboarding access
router.get('/:diseaseId', verifyAccessTokenMiddleware, requireAnyPermission(['symptom:view:all', 'onboarding:access:own']), getSymptomsByDisease);

// Add a symptom to a disease - requires symptom creation permission
router.post('/:diseaseId', verifyAccessTokenMiddleware, requirePermission('symptom:create:all'), addSymptom);

// Update a symptom - requires symptom update permission
router.put('/:id', verifyAccessTokenMiddleware, requirePermission('symptom:update:all'), updateSymptom);

// Delete a symptom - requires symptom deletion permission
router.delete('/:id', verifyAccessTokenMiddleware, requirePermission('symptom:delete:all'), deleteSymptom);

export default router; 