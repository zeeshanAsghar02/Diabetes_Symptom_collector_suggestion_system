import express from 'express';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';
import { 
    getAllRoles, 
    getRolePermissions, 
    updateRolePermissions 
} from '../controllers/roleController.js';

const router = express.Router();

// All routes require authentication and role management permission
router.use(verifyAccessTokenMiddleware, requirePermission('role:manage:all'));

// Get all roles
router.get('/', getAllRoles);

// Get permissions for a specific role
router.get('/:roleId/permissions', getRolePermissions);

// Update permissions for a role
router.put('/:roleId/permissions', updateRolePermissions);

export default router;
