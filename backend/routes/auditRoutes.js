import express from 'express';
import {
    getAuditLogs,
    getAuditLogDetail,
    getAuditAnalytics,
    exportAuditLogs,
} from '../controllers/auditController.js';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';
import { roleCheckMiddleware } from '../middlewares/roleCheckMiddleware.js';
import { captureAuditContext } from '../middlewares/auditMiddleware.js';

const router = express.Router();

// Apply authentication and audit context capture to all routes
router.use(verifyAccessTokenMiddleware);
router.use(captureAuditContext);
router.use(roleCheckMiddleware);

/**
 * GET /api/v1/admin/audit-logs/analytics
 * Get analytics and statistics
 * NOTE: Must come BEFORE /:id route to avoid conflict
 */
router.get('/analytics', getAuditAnalytics);

/**
 * POST /api/v1/admin/audit-logs/export
 * Export audit logs in CSV or JSON format
 * NOTE: Must come BEFORE /:id route to avoid conflict
 */
router.post('/export', exportAuditLogs);

/**
 * GET /api/v1/admin/audit-logs
 * Fetch audit logs with filters and pagination
 */
router.get('/', getAuditLogs);

/**
 * GET /api/v1/admin/audit-logs/:id
 * Fetch single audit log details
 * NOTE: Must come AFTER specific routes like /analytics and /export
 */
router.get('/:id', getAuditLogDetail);

export default router;
