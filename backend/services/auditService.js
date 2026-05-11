import AuditLog from '../models/AuditLog.js';

class AuditService {
    /**
     * Log an action to the audit trail
     * @param {Object} options - Audit log options
     */
    static async logAction(options) {
        try {
            const {
                user_id,
                user_email,
                user_role,
                action,
                resource,
                resource_id,
                changes = null,
                ip_address,
                user_agent,
                status = 'SUCCESS',
                error_message = null,
                involves_pii = false,
                involves_phi = false,
            } = options;

            console.log('📝 Creating audit log:', { user_email, action, resource, status });

            // Calculate retention date (2 years from now by default)
            const retention_expires_at = new Date();
            retention_expires_at.setFullYear(retention_expires_at.getFullYear() + 2);

            const auditLog = new AuditLog({
                user_id,
                user_email,
                user_role: Array.isArray(user_role) ? user_role : [user_role],
                action,
                resource,
                resource_id,
                changes,
                timestamp: new Date(),
                ip_address,
                user_agent,
                status,
                error_message,
                involves_pii,
                involves_phi,
                retention_expires_at,
            });

            await auditLog.save();
            console.log('✅ Audit log saved successfully:', auditLog._id);
            return auditLog;
        } catch (error) {
            console.error('❌ Error logging audit action:', error.message);
            console.error('❌ Error stack:', error.stack);
            // Don't throw - audit logging shouldn't break main operations
            return null;
        }
    }

    /**
     * Get audit logs with filters and pagination
     */
    static async getAuditLogs(filters = {}, options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                sort = { timestamp: -1 },
            } = options;

            const query = this._buildQuery(filters);

            const total = await AuditLog.countDocuments(query);
            const totalPages = Math.ceil(total / limit);

            const logs = await AuditLog.find(query)
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            return {
                logs,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                },
            };
        } catch (error) {
            console.error('Error fetching audit logs:', error.message);
            throw error;
        }
    }

    /**
     * Get a single audit log by ID
     */
    static async getAuditLogById(id) {
        try {
            const log = await AuditLog.findById(id)
                .populate('user_id', 'email fullName')
                .exec();

            return log;
        } catch (error) {
            console.error('Error fetching audit log:', error.message);
            throw error;
        }
    }

    /**
     * Get audit analytics
     */
    static async getAnalytics(startDate, endDate) {
        try {
            // Validate dates
            const start = startDate instanceof Date ? startDate : new Date(startDate);
            const end = endDate instanceof Date ? endDate : new Date(endDate);
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new Error('Invalid date parameters provided');
            }
            
            const dateFilter = {
                timestamp: {
                    $gte: start,
                    $lte: end,
                },
            };

            console.log('📊 Generating analytics with date range:', { start, end });
            
            // Total events
            const totalEvents = await AuditLog.countDocuments(dateFilter);
            console.log(`📈 Total events found: ${totalEvents}`);

            // Events by action
            const eventsByAction = await AuditLog.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]);
            console.log(`✅ Events by action: ${eventsByAction.length} groups`);

            // Events by resource
            const eventsByResource = await AuditLog.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$resource', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]);
            console.log(`✅ Events by resource: ${eventsByResource.length} groups`);

            // Events by hour
            const eventsByHour = await AuditLog.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d %H:00',
                                date: '$timestamp',
                            },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);
            console.log(`✅ Events by hour: ${eventsByHour.length} data points`);

            // Success/Failure stats
            const statusStats = await AuditLog.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]);
            console.log(`✅ Status stats: ${statusStats.length} statuses`);

            // Top users
            const topUsers = await AuditLog.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$user_email', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]);
            console.log(`✅ Top users: ${topUsers.length} users`);

            // Failed operations
            const failedOps = await AuditLog.countDocuments({
                ...dateFilter,
                status: 'FAILURE',
            });

            const successRate = totalEvents > 0 ? ((totalEvents - failedOps) / totalEvents * 100).toFixed(2) : 100;

            return {
                totalEvents,
                failedOps,
                successRate: parseFloat(successRate),
                eventsByAction,
                eventsByResource,
                eventsByHour,
                statusStats,
                topUsers,
            };
        } catch (error) {
            console.error('❌ Error generating analytics:', error.message);
            console.error('❌ Stack trace:', error.stack);
            console.error('❌ Date filter used:', JSON.stringify({
                startDate: startDate,
                endDate: endDate
            }));
            throw error;
        }
    }

    /**
     * Export audit logs
     */
    static async exportLogs(filters = {}, format = 'csv') {
        try {
            const query = this._buildQuery(filters);
            const logs = await AuditLog.find(query).sort({ timestamp: -1 }).lean();

            if (format === 'csv') {
                return this._convertToCSV(logs);
            } else if (format === 'json') {
                return logs;
            }

            throw new Error('Unsupported export format');
        } catch (error) {
            console.error('Error exporting audit logs:', error.message);
            throw error;
        }
    }

    /**
     * Build MongoDB query from filters
     */
    static _buildQuery(filters) {
        const query = {};

        if (filters.user_email && filters.user_email !== 'undefined') {
            query.user_email = new RegExp(filters.user_email, 'i');
        }

        if (filters.user_id && filters.user_id !== 'undefined') {
            query.user_id = filters.user_id;
        }

        if (filters.action && filters.action !== 'undefined') {
            query.action = filters.action;
        }

        if (filters.resource && filters.resource !== 'undefined') {
            query.resource = filters.resource;
        }

        if (filters.status && filters.status !== 'undefined') {
            query.status = filters.status;
        }

        // Handle date filters with validation
        const hasValidStartDate = filters.startDate && 
            filters.startDate !== 'undefined' && 
            filters.startDate !== 'null' &&
            !isNaN(new Date(filters.startDate).getTime());
            
        const hasValidEndDate = filters.endDate && 
            filters.endDate !== 'undefined' && 
            filters.endDate !== 'null' &&
            !isNaN(new Date(filters.endDate).getTime());

        if (hasValidStartDate || hasValidEndDate) {
            query.timestamp = {};
            if (hasValidStartDate) {
                query.timestamp.$gte = new Date(filters.startDate);
            }
            if (hasValidEndDate) {
                query.timestamp.$lte = new Date(filters.endDate);
            }
        }

        return query;
    }

    /**
     * Convert logs to CSV format
     */
    static _convertToCSV(logs) {
        if (!logs || logs.length === 0) {
            return 'No data to export';
        }

        const headers = [
            'Timestamp',
            'User Email',
            'User Role',
            'Action',
            'Resource',
            'Resource ID',
            'Status',
            'Error Message',
        ];

        const rows = logs.map((log) => [
            log.timestamp || '',
            log.user_email || '',
            (log.user_role || []).join(';'),
            log.action || '',
            log.resource || '',
            log.resource_id || '',
            log.status || '',
            log.error_message || '',
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row) =>
                row
                    .map((field) => `"${(field || '').toString().replace(/"/g, '""')}"`)
                    .join(',')
            ),
        ].join('\n');

        return csvContent;
    }

    /**
     * Cleanup old audit logs based on retention policy
     */
    static async cleanupExpiredLogs() {
        try {
            const result = await AuditLog.deleteMany({
                retention_expires_at: { $lt: new Date() },
            });

            console.log(`Cleaned up ${result.deletedCount} expired audit logs`);
            return result;
        } catch (error) {
            console.error('Error cleaning up audit logs:', error.message);
            throw error;
        }
    }
}

export default AuditService;
