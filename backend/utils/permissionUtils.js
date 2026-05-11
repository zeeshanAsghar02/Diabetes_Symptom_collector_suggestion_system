import { UsersRoles } from '../models/User_Role.js';
import { RolePermissions } from '../models/RolePermissions.js';
import { Permission } from '../models/Permissions.js';
import mongoose from 'mongoose';

export async function hasPermission(userId, permissionName) {
    try {
        // Input validation
        if (!userId || !permissionName) {
            console.log('Permission check: Missing userId or permissionName');
            return false;
        }

        // Convert userId to ObjectId if it's a string
        let userObjectId;
        try {
            userObjectId = typeof userId === 'string' 
                ? new mongoose.Types.ObjectId(userId) 
                : userId;
        } catch (error) {
            console.log('Permission check: Invalid userId format');
            return false;
        }

        // Step 1: Get user's roles with populated role data
        const userRoles = await UsersRoles.find({ 
            user_id: userObjectId,
            deleted_at: null 
        }).populate('role_id');

        if (!userRoles || userRoles.length === 0) {
            console.log(`Permission check: User ${userId} has no roles`);
            return false;
        }

        // Extract role IDs
        const roleIds = userRoles
            .filter(ur => ur.role_id && ur.role_id._id) // Filter out null populated results
            .map(ur => ur.role_id._id);

        if (roleIds.length === 0) {
            console.log(`Permission check: User ${userId} has no valid roles`);
            return false;
        }

        // Step 2: Get role permissions with populated permission data
        const rolePermissions = await RolePermissions.find({ 
            role_id: { $in: roleIds },
            is_active: true,
            deleted_at: null 
        }).populate('permission_id');

        if (!rolePermissions || rolePermissions.length === 0) {
            console.log(`Permission check: Roles for user ${userId} have no permissions`);
            return false;
        }

        // Step 3: Check if required permission exists
        const hasRequiredPermission = rolePermissions.some(rp => 
            rp.permission_id && 
            rp.permission_id.name === permissionName &&
            rp.permission_id.is_active === true &&
            rp.permission_id.deleted_at === null
        );

        console.log(`Permission check: User ${userId} ${hasRequiredPermission ? 'HAS' : 'DOES NOT HAVE'} permission ${permissionName}`);
        return hasRequiredPermission;

    } catch (error) {
        console.error('Permission check error:', error);
        return false;
    }
}

