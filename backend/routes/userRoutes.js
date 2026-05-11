import express from 'express';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';
import { 
  getProfile,
  updateProfile,
  getCurrentUser, 
  getAllUsers, 
  updateUser, 
  deleteUser, 
  getMyDiseaseData,
  getUserDiseaseDataForEditing,
  updateUserDiseaseDataAnswer,
  submitDiseaseData,
  getAllAdmins,
  getUserRoles,
  updateUserRole
} from '../controllers/userController.js';

const router = express.Router();

// User profile - accessible to authenticated users
router.get('/profile', verifyAccessTokenMiddleware, getProfile);
router.put('/profile', verifyAccessTokenMiddleware, updateProfile);

// Get all users - requires user read permission
router.get('/allUsers', verifyAccessTokenMiddleware, requirePermission('user:read:all'), getAllUsers);

// Update user - requires user update permission
router.put('/updateUser/:id', verifyAccessTokenMiddleware, requirePermission('user:update:all'), updateUser);

// Delete user - requires user delete permission
router.delete('/deleteUser/:id', verifyAccessTokenMiddleware, requirePermission('user:delete:all'), deleteUser);

// User's own disease data - accessible to users who can view their own disease data
router.get('/my-disease-data', verifyAccessTokenMiddleware, requirePermission('disease:view:own'), getMyDiseaseData);

// Disease data editing routes - accessible to users who can edit their own disease data
router.get('/disease-data-for-editing', verifyAccessTokenMiddleware, requirePermission('disease:edit:own'), getUserDiseaseDataForEditing);
router.put('/update-disease-data-answer', verifyAccessTokenMiddleware, requirePermission('disease:edit:own'), updateUserDiseaseDataAnswer);
router.post('/submit-disease-data', verifyAccessTokenMiddleware, requirePermission('disease:submit:own'), submitDiseaseData);

// Super admin specific routes - require role management permission
router.get('/allAdmins', verifyAccessTokenMiddleware, requirePermission('role:manage:all'), getAllAdmins);

// Current user's roles - any authenticated user
router.get('/roles', verifyAccessTokenMiddleware, getUserRoles);

// Update a user's role - require role management permission
router.put('/updateUserRole/:id', verifyAccessTokenMiddleware, requirePermission('role:manage:all'), updateUserRole);

export default router;
