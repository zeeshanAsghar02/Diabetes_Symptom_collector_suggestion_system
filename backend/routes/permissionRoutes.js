import express from 'express';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';
import { 
    getAllPermissions, 
    getPermissionById 
} from '../controllers/permissionController.js';

const router = express.Router();

// All routes require authentication and permission management permission
router.use(verifyAccessTokenMiddleware, requirePermission('permission:manage:all'));

// Get all permissions
router.get('/', getAllPermissions);

// Get permission by ID
router.get('/:id', getPermissionById);

export default router;
