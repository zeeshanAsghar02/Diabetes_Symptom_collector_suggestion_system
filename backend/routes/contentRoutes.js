import express from 'express';
import {
  getAllContent,
  getContent,
  getContentBySlug,
  createContent,
  updateContent,
  deleteContent,
  getContentStats,
  getRelatedContent,
  reviewContent
} from '../controllers/contentController.js';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';
import {
  validateContent,
  validateContentUpdate,
  validateContentQuery,
  validateId,
  validateSlug
} from '../middlewares/contentValidationMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', validateContentQuery, getAllContent);
router.get('/stats', verifyAccessTokenMiddleware, requirePermission('content:view:all'), getContentStats);
router.get('/slug/:slug', validateSlug, getContentBySlug);
router.get('/:id/related', validateId, getRelatedContent);
router.get('/:id', validateId, getContent);

// Protected routes (CMS permissions required)
router.post('/', verifyAccessTokenMiddleware, requirePermission('content:create:all'), validateContent, createContent);
router.put('/:id', verifyAccessTokenMiddleware, requirePermission('content:update:all'), validateId, validateContentUpdate, updateContent);
router.put('/:id/review', verifyAccessTokenMiddleware, requirePermission('content:update:all'), validateId, reviewContent);
router.delete('/:id', verifyAccessTokenMiddleware, requirePermission('content:delete:all'), validateId, deleteContent);

export default router;
