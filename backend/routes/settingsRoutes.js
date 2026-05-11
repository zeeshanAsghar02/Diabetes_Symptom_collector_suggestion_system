import express from 'express';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';
import { superAdminMiddleware } from '../middlewares/superAdminMiddleware.js';
import {
    getAllSettings,
    getSettingByKey,
    updateSetting,
    bulkUpdateSettings
} from '../controllers/settingsController.js';

const router = express.Router();

// All routes require authentication and super admin role
router.use(verifyAccessTokenMiddleware);
router.use(superAdminMiddleware);

// Get all settings
router.get('/', getAllSettings);

// Get single setting by key
router.get('/:key', getSettingByKey);

// Update single setting
router.put('/:key', updateSetting);

// Bulk update settings
router.put('/', bulkUpdateSettings);

export default router;
