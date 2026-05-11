import express from 'express';
import {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats
} from '../controllers/categoryController.js';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';
import {
  validateCategory,
  validateCategoryUpdate,
  validateCategoryQuery,
  validateId
} from '../middlewares/contentValidationMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', validateCategoryQuery, getAllCategories);
router.get('/stats', verifyAccessTokenMiddleware, requirePermission('category:view:all'), getCategoryStats);
router.get('/:id', validateId, getCategory);

// Protected routes (CMS permissions required)
router.post('/', verifyAccessTokenMiddleware, requirePermission('category:create:all'), validateCategory, createCategory);
router.put('/:id', verifyAccessTokenMiddleware, requirePermission('category:update:all'), validateId, validateCategoryUpdate, updateCategory);
router.delete('/:id', verifyAccessTokenMiddleware, requirePermission('category:delete:all'), validateId, deleteCategory);

export default router;
