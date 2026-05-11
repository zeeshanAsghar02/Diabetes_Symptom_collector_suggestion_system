import express from 'express';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';
import { requirePermission, requireAnyPermission } from '../middlewares/permissionMiddleware.js';
import { getAllDiseases, addDisease, updateDisease, deleteDisease } from '../controllers/diseaseController.js';

const router = express.Router();

// Public endpoint for onboarding - no authentication required
router.get('/public', getAllDiseases);

// Get all diseases - requires either admin view or user onboarding access
router.get('/', verifyAccessTokenMiddleware, requireAnyPermission(['disease:view:all', 'onboarding:access:own']), getAllDiseases);

// Add a new disease - requires disease creation permission
router.post('/', verifyAccessTokenMiddleware, requirePermission('disease:create:all'), addDisease);

// Update a disease - requires disease update permission
router.put('/:id', verifyAccessTokenMiddleware, requirePermission('disease:update:all'), updateDisease);

// Delete a disease - requires disease deletion permission
router.delete('/:id', verifyAccessTokenMiddleware, requirePermission('disease:delete:all'), deleteDisease);

export default router; 