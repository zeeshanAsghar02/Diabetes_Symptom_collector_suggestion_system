import AuditService from '../services/auditService.js';

/**
 * GET /api/v1/admin/audit-logs
 * Get all audit logs with optional filters and pagination
 * Access: Admin, Super Admin
 */
export const getAuditLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            user_email,
            user_id,
            action,
            resource,
            status,
            startDate,
            endDate,
        } = req.query;

        const filters = {
            ...(user_email && { user_email }),
            ...(user_id && { user_id }),
            ...(action && { action }),
            ...(resource && { resource }),
            ...(status && { status }),
            ...(startDate || endDate ? { startDate, endDate } : {}),
        };

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
        };

        const result = await AuditService.getAuditLogs(filters, options);

        res.status(200).json({
            success: true,
            message: 'Audit logs retrieved successfully',
            data: result.logs,
            pagination: result.pagination,
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching audit logs',
            error: error.message,
        });
    }
};

/**
 * GET /api/v1/admin/audit-logs/:id
 * Get single audit log details
 * Access: Admin, Super Admin
 */
export const getAuditLogDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const log = await AuditService.getAuditLogById(id);

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Audit log not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Audit log retrieved successfully',
            data: log,
        });
    } catch (error) {
        console.error('Error fetching audit log detail:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching audit log detail',
            error: error.message,
        });
    }
};

/**
 * GET /api/v1/admin/audit-logs/analytics
 * Get audit logs analytics and statistics
 * Access: Admin, Super Admin
 */
export const getAuditAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Validate and parse dates
        const hasValidEndDate = endDate && 
            endDate !== 'undefined' && 
            endDate !== 'null' && 
            !isNaN(new Date(endDate).getTime());
            
        const hasValidStartDate = startDate && 
            startDate !== 'undefined' && 
            startDate !== 'null' && 
            !isNaN(new Date(startDate).getTime());

        // Default to last 7 days if not specified or invalid
        const end = hasValidEndDate ? new Date(endDate) : new Date();
        const start = hasValidStartDate
            ? new Date(startDate)
            : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

        const analytics = await AuditService.getAnalytics(start, end);

        res.status(200).json({
            success: true,
            message: 'Analytics retrieved successfully',
            data: {
                period: {
                    startDate: start,
                    endDate: end,
                },
                ...analytics,
            },
        });
    } catch (error) {
        console.error('❌ Error fetching analytics:', error.message);
        console.error('❌ Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics',
            error: error.message,
        });
    }
};

/**
 * POST /api/v1/admin/audit-logs/export
 * Export audit logs in CSV or JSON format
 * Access: Admin, Super Admin
 */
export const exportAuditLogs = async (req, res) => {
    try {
        const {
            format = 'csv',
            user_email,
            user_id,
            action,
            resource,
            status,
            startDate,
            endDate,
        } = req.body;

        // Validate format
        if (!['csv', 'json'].includes(format)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid export format. Supported: csv, json',
            });
        }

        const filters = {
            ...(user_email && { user_email }),
            ...(user_id && { user_id }),
            ...(action && { action }),
            ...(resource && { resource }),
            ...(status && { status }),
            ...(startDate || endDate ? { startDate, endDate } : {}),
        };

        const exportData = await AuditService.exportLogs(filters, format);

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="audit-logs-${new Date().getTime()}.csv"`
            );
            return res.send(exportData);
        } else {
            res.status(200).json({
                success: true,
                message: 'Audit logs exported successfully',
                data: exportData,
            });
        }
    } catch (error) {
        console.error('Error exporting audit logs:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error exporting audit logs',
            error: error.message,
        });
    }
};

export default {
    getAuditLogs,
    getAuditLogDetail,
    getAuditAnalytics,
    exportAuditLogs,
};
