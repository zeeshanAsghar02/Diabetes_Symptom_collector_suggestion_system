import { Role } from '../models/Role.js';
import { Permission } from '../models/Permissions.js';
import { RolePermissions } from '../models/RolePermissions.js';

// Permissions every regular user must have for core assessment features
const USER_CORE_PERMISSIONS = [
  'disease:view:own',
  'disease:edit:own',
  'disease:submit:own',
  'answer:submit:own',
  'onboarding:access:own',
  'onboarding:complete:own',
  'symptom:view:all',
  'question:view:all',
  'category:view:all',
  'content:view:all',
];

/**
 * Ensures the user role has all core permissions needed for assessment/onboarding.
 * Called automatically on server startup — only adds missing permissions, never removes existing ones.
 */
export const ensureRolePermissions = async () => {
  try {
    const userRole = await Role.findOne({ role_name: 'user' });
    if (!userRole) {
      console.log('⚠️  User role not found — run ensureRolesExist first');
      return false;
    }

    // Collect the permission IDs already assigned to the user role
    const existingRolePerms = await RolePermissions.find({
      role_id: userRole._id,
      is_active: true,
      deleted_at: null,
    }).select('permission_id');

    const existingPermIds = new Set(existingRolePerms.map(rp => String(rp.permission_id)));

    let addedCount = 0;
    for (const permName of USER_CORE_PERMISSIONS) {
      const permission = await Permission.findOne({ name: permName, deleted_at: null });
      if (!permission) {
        // Permission doesn't exist in DB yet — skip silently (seed-all-permissions must be run first)
        continue;
      }
      if (!existingPermIds.has(String(permission._id))) {
        await RolePermissions.create({
          role_id: userRole._id,
          permission_id: permission._id,
          is_active: true,
        });
        addedCount++;
        console.log(`  ✅ Added permission to user role: ${permName}`);
      }
    }

    if (addedCount > 0) {
      console.log(`✅ ensureRolePermissions: Added ${addedCount} missing permission(s) to the user role`);
    } else {
      console.log('✅ ensureRolePermissions: User role already has all core permissions');
    }
    return true;
  } catch (error) {
    console.error('❌ Error ensuring role permissions:', error);
    return false;
  }
};

/**
 * Ensures that all necessary roles exist in the database
 * This function should be called during server startup
 */
export const ensureRolesExist = async () => {
    try {
        const requiredRoles = ['user', 'admin', 'super_admin'];
        
        for (const roleName of requiredRoles) {
            const existingRole = await Role.findOne({ role_name: roleName });
            if (!existingRole) {
                const newRole = new Role({ role_name: roleName });
                await newRole.save();
                console.log(`✅ Created role: ${roleName}`);
            } else {
                console.log(`✅ Role already exists: ${roleName}`);
            }
        }
        
        console.log('✅ All required roles are available in the database');
        return true;
    } catch (error) {
        console.error('❌ Error ensuring roles exist:', error);
        return false;
    }
};

/**
 * Gets the user role from the database
 * @returns {Object|null} The user role object or null if not found
 */
export const getUserRole = async () => {
    try {
        const userRole = await Role.findOne({ role_name: 'user' });
        return userRole;
    } catch (error) {
        console.error('Error getting user role:', error);
        return null;
    }
};

/**
 * Assigns the default 'user' role to a new user
 * @param {string} userId - The ID of the user to assign the role to
 * @returns {boolean} True if successful, false otherwise
 */
export const assignDefaultUserRole = async (userId) => {
    try {
        const { UsersRoles } = await import('../models/User_Role.js');
        
        // Get the user role
        const userRole = await getUserRole();
        if (!userRole) {
            console.error('User role not found in database');
            return false;
        }
        
        // Check if user already has this role
        const existingUserRole = await UsersRoles.findOne({ 
            user_id: userId, 
            role_id: userRole._id 
        });
        
        if (existingUserRole) {
            console.log('User already has user role assigned');
            return true;
        }
        
        // Assign the user role
        await UsersRoles.create({
            user_id: userId,
            role_id: userRole._id
        });
        
        console.log(`✅ Assigned 'user' role to user: ${userId}`);
        return true;
    } catch (error) {
        console.error('Error assigning default user role:', error);
        return false;
    }
};
