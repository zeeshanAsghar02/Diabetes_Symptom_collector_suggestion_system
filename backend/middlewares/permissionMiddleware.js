import { hasPermission } from '../utils/permissionUtils.js';

/**
 * Middleware to check if user has a specific permission
 * @param {string} permissionName - The permission name to check
 * @returns {Function} Express middleware function
 */
export const requirePermission = (permissionName) => {
    return async (req, res, next) => {
        try {
            const userId = req.user._id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                    code: "UNAUTHENTICATED"
                });
            }

            const hasRequiredPermission = await hasPermission(userId, permissionName);
            
            if (hasRequiredPermission) {
                console.log(`Permission granted: User ${userId} has permission ${permissionName}`);
                return next();
            } else {
                console.log(`Permission denied: User ${userId} lacks permission ${permissionName}`);
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required permission: ${permissionName}`,
                    code: "INSUFFICIENT_PERMISSIONS"
                });
            }
        } catch (error) {
            console.error('Permission middleware error:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error during permission check",
                code: "PERMISSION_CHECK_ERROR"
            });
        }
    };
};

/**
 * Middleware to check if user has any of the specified permissions
 * @param {string[]} permissionNames - Array of permission names to check (any one is sufficient)
 * @returns {Function} Express middleware function
 */
export const requireAnyPermission = (permissionNames) => {
    return async (req, res, next) => {
        try {
            const userId = req.user._id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                    code: "UNAUTHENTICATED"
                });
            }

            // Check if user has any of the required permissions
            for (const permissionName of permissionNames) {
                const hasRequiredPermission = await hasPermission(userId, permissionName);
                if (hasRequiredPermission) {
                    console.log(`Permission granted: User ${userId} has permission ${permissionName}`);
                    return next();
                }
            }

            console.log(`Permission denied: User ${userId} lacks all permissions: ${permissionNames.join(', ')}`);
            return res.status(403).json({
                success: false,
                message: `Access denied. Required permissions: ${permissionNames.join(' OR ')}`,
                code: "INSUFFICIENT_PERMISSIONS"
            });
        } catch (error) {
            console.error('Permission middleware error:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error during permission check",
                code: "PERMISSION_CHECK_ERROR"
            });
        }
    };
};

/**
 * Middleware to check if user has all of the specified permissions
 * @param {string[]} permissionNames - Array of permission names to check (all required)
 * @returns {Function} Express middleware function
 */
export const requireAllPermissions = (permissionNames) => {
    return async (req, res, next) => {
        try {
            const userId = req.user._id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                    code: "UNAUTHENTICATED"
                });
            }

            // Check if user has all required permissions
            for (const permissionName of permissionNames) {
                const hasRequiredPermission = await hasPermission(userId, permissionName);
                if (!hasRequiredPermission) {
                    console.log(`Permission denied: User ${userId} lacks permission ${permissionName}`);
                    return res.status(403).json({
                        success: false,
                        message: `Access denied. Required permission: ${permissionName}`,
                        code: "INSUFFICIENT_PERMISSIONS"
                    });
                }
            }

            console.log(`All permissions granted: User ${userId} has all required permissions`);
            return next();
        } catch (error) {
            console.error('Permission middleware error:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error during permission check",
                code: "PERMISSION_CHECK_ERROR"
            });
        }
    };
};


