import { Permission } from '../models/Permissions.js';

// Get all permissions
export const getAllPermissions = async (req, res) => {
    try {
        const permissions = await Permission.find({ 
            is_active: true,
            deleted_at: null 
        });
        
        return res.status(200).json({
            success: true,
            data: permissions
        });
    } catch (error) {
        console.error('Error fetching permissions:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch permissions'
        });
    }
};

// Get permission by ID
export const getPermissionById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const permission = await Permission.findById(id);
        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: permission
        });
    } catch (error) {
        console.error('Error fetching permission:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch permission'
        });
    }
};
