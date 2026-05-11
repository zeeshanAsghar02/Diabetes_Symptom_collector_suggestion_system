import { Role } from '../models/Role.js';
import { Permission } from '../models/Permissions.js';
import { RolePermissions } from '../models/RolePermissions.js';
import { createAuditLog } from '../middlewares/auditMiddleware.js';

// Get all roles
export const getAllRoles = async (req, res) => {
    try {
        const roles = await Role.find({ deleted_at: null });
        return res.status(200).json({
            success: true,
            data: roles
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch roles'
        });
    }
};

// Get permissions for a specific role
export const getRolePermissions = async (req, res) => {
    try {
        const { roleId } = req.params;
        
        const rolePermissions = await RolePermissions.find({ 
            role_id: roleId,
            is_active: true,
            deleted_at: null 
        }).populate('permission_id');
        
        return res.status(200).json({
            success: true,
            data: rolePermissions
        });
    } catch (error) {
        console.error('Error fetching role permissions:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch role permissions'
        });
    }
};

// Update permissions for a role
export const updateRolePermissions = async (req, res) => {
    try {
        const { roleId } = req.params;
        const { permissionIds } = req.body;
        
        if (!Array.isArray(permissionIds)) {
            return res.status(400).json({
                success: false,
                message: 'Permission IDs must be an array'
            });
        }
        
        // Get previous permissions for audit log
        const previousPermissions = await RolePermissions.find({ 
            role_id: roleId,
            is_active: true 
        }).populate('permission_id');
        
        // Get role info
        const role = await Role.findById(roleId);
        
        // First, deactivate all existing permissions for this role
        await RolePermissions.updateMany(
            { role_id: roleId },
            { is_active: false }
        );
        
        // Then, create/activate new permissions
        const rolePermissionPromises = permissionIds.map(permissionId => {
            return RolePermissions.findOneAndUpdate(
                { role_id: roleId, permission_id: permissionId },
                { 
                    role_id: roleId, 
                    permission_id: permissionId,
                    is_active: true,
                    assigned_at: new Date()
                },
                { upsert: true, new: true }
            );
        });
        
        await Promise.all(rolePermissionPromises);
        
        // Log permission change to audit trail
        try {
            const oldPermissionNames = previousPermissions.map(rp => rp.permission_id?.permission_key);
            const newPermissions = await RolePermissions.find({ 
                role_id: roleId,
                is_active: true 
            }).populate('permission_id');
            const newPermissionNames = newPermissions.map(rp => rp.permission_id?.permission_key);
            
            await createAuditLog('UPDATE', 'RolePermissions', req, res, roleId, {
                role: role?.role_name,
                before: { permissions: oldPermissionNames },
                after: { permissions: newPermissionNames },
                action: 'Permissions Modified'
            });
        } catch (auditErr) {
            console.error('Failed to log permission change to audit trail:', auditErr);
        }
        
        return res.status(200).json({
            success: true,
            message: 'Role permissions updated successfully'
        });
    } catch (error) {
        console.error('Error updating role permissions:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update role permissions'
        });
    }
};
