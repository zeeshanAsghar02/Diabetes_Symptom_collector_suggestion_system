/**
 * Permission Utilities for Frontend
 * 
 * These utilities help enforce permissions on the frontend by checking
 * user permissions before showing/enabling features.
 */

import React from 'react';
import axiosInstance from './axiosInstance';

// Cache for user permissions
let userPermissionsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch and cache user permissions
 * @returns {Promise<string[]>} Array of permission names
 */
export async function getUserPermissions(forceRefresh = false) {
  // Return cached permissions if available and not expired
  if (!forceRefresh && userPermissionsCache && cacheTimestamp) {
    const now = Date.now();
    if (now - cacheTimestamp < CACHE_DURATION) {
      return userPermissionsCache;
    }
  }

  try {
    // Fetch user roles
    const rolesRes = await axiosInstance.get('/users/roles');
    const userRoles = rolesRes.data.data || [];

    if (userRoles.length === 0) {
      userPermissionsCache = [];
      cacheTimestamp = Date.now();
      return [];
    }

    // Fetch all roles to get role IDs
    const allRolesRes = await axiosInstance.get('/roles');
    const allRoles = allRolesRes.data.data || [];

    // Find role objects for user's roles
    const userRoleObjects = allRoles.filter(role => userRoles.includes(role.role_name));
    const userRoleIds = userRoleObjects.map(role => role._id);

    // Fetch permissions for each role
    const permissionPromises = userRoleIds.map(roleId =>
      axiosInstance.get(`/roles/${roleId}/permissions`)
        .then(res => res.data.data || [])
        .catch(() => [])
    );

    const rolePermissions = await Promise.all(permissionPromises);

    // Flatten and deduplicate permissions
    const allPermissions = rolePermissions.flat();
    const uniquePermissions = [...new Set(
      allPermissions
        .filter(rp => rp.permission_id && rp.permission_id.is_active)
        .map(rp => rp.permission_id.name)
    )];

    // Cache the results
    userPermissionsCache = uniquePermissions;
    cacheTimestamp = Date.now();

    return uniquePermissions;
  } catch (error) {
    console.error('Failed to fetch user permissions:', error);
    return [];
  }
}

/**
 * Check if user has a specific permission
 * @param {string} permissionName - Permission to check (e.g., 'user:read:all')
 * @returns {Promise<boolean>}
 */
export async function hasPermission(permissionName) {
  const permissions = await getUserPermissions();
  return permissions.includes(permissionName);
}

/**
 * Check if user has any of the specified permissions
 * @param {string[]} permissionNames - Array of permissions to check
 * @returns {Promise<boolean>}
 */
export async function hasAnyPermission(permissionNames) {
  const permissions = await getUserPermissions();
  return permissionNames.some(perm => permissions.includes(perm));
}

/**
 * Check if user has all of the specified permissions
 * @param {string[]} permissionNames - Array of permissions to check
 * @returns {Promise<boolean>}
 */
export async function hasAllPermissions(permissionNames) {
  const permissions = await getUserPermissions();
  return permissionNames.every(perm => permissions.includes(perm));
}

/**
 * Clear the permissions cache (call this on login/logout)
 */
export function clearPermissionsCache() {
  userPermissionsCache = null;
  cacheTimestamp = null;
}

/**
 * React Hook for checking permissions
 * Usage: const { hasPermission, loading } = usePermission('user:read:all');
 */
export function usePermission(permissionName) {
  const [hasPermissionState, setHasPermissionState] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    async function checkPermission() {
      try {
        const result = await hasPermission(permissionName);
        if (mounted) {
          setHasPermissionState(result);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setHasPermissionState(false);
          setLoading(false);
        }
      }
    }

    checkPermission();

    return () => {
      mounted = false;
    };
  }, [permissionName]);

  return { hasPermission: hasPermissionState, loading };
}

/**
 * React Hook for checking multiple permissions (any)
 */
export function useAnyPermission(permissionNames) {
  const [hasPermissionState, setHasPermissionState] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const permissionsKey = React.useMemo(() => permissionNames.join(','), [permissionNames]);

  React.useEffect(() => {
    let mounted = true;

    async function checkPermissions() {
      try {
        const result = await hasAnyPermission(permissionNames);
        if (mounted) {
          setHasPermissionState(result);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setHasPermissionState(false);
          setLoading(false);
        }
      }
    }

    checkPermissions();

    return () => {
      mounted = false;
    };
  }, [permissionsKey, permissionNames]);

  return { hasPermission: hasPermissionState, loading };
}

/**
 * React Hook for checking multiple permissions (all)
 */
export function useAllPermissions(permissionNames) {
  const [hasPermissionState, setHasPermissionState] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const permissionsKey = React.useMemo(() => permissionNames.join(','), [permissionNames]);

  React.useEffect(() => {
    let mounted = true;

    async function checkPermissions() {
      try {
        const result = await hasAllPermissions(permissionNames);
        if (mounted) {
          setHasPermissionState(result);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setHasPermissionState(false);
          setLoading(false);
        }
      }
    }

    checkPermissions();

    return () => {
      mounted = false;
    };
  }, [permissionsKey, permissionNames]);

  return { hasPermission: hasPermissionState, loading };
}
