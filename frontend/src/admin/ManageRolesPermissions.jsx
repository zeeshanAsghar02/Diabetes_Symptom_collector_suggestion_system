import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  SelectAll as SelectAllIcon
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';

export default function ManageRolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState([]);

  // Load data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch roles and permissions in parallel
      const [rolesResponse, permissionsResponse] = await Promise.all([
        axiosInstance.get('/roles'),
        axiosInstance.get('/permissions')
      ]);
      
      setRoles(rolesResponse.data.data || []);
      setPermissions(permissionsResponse.data.data || []);

      // Batch fetch role permissions for all roles
      const roleIds = rolesResponse.data.data || [];
      const rolePermsPromises = roleIds.map(role => 
        axiosInstance.get(`/roles/${role._id}/permissions`)
          .then(res => ({ roleId: role._id, permissions: res.data.data || [] }))
      );
      
      const rolePermsResults = await Promise.all(rolePermsPromises);
      
      // Convert array to object for easy access
      const rolePerms = {};
      rolePermsResults.forEach(({ roleId, permissions }) => {
        rolePerms[roleId] = permissions;
      });
      
      setRolePermissions(rolePerms);
      toast.success('Loaded roles and permissions');
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (role) => {
    // Protect super_admin role
    if (role.role_name === 'super_admin') {
      toast.error('Super Admin permissions cannot be modified for security reasons');
      return;
    }
    
    setSelectedRole(role);
    const currentPerms = rolePermissions[role._id] || [];
    setSelectedPermissions(currentPerms.map(rp => rp.permission_id._id));
    setEditDialogOpen(true);
    setPermissionSearch('');
    // Expand all categories by default
    const categories = [...new Set(permissions.map(p => getPermissionCategory(p)))];
    setExpandedCategories(categories);
  };

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleCategorySelectAll = (categoryPermissions, categoryName) => {
    const categoryPermissionIds = categoryPermissions.map(p => p._id);
    const allSelected = categoryPermissionIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      // Deselect all in this category
      setSelectedPermissions(prev => prev.filter(id => !categoryPermissionIds.includes(id)));
      toast.info(`Deselected all ${formatCategoryName(categoryName)} permissions`);
    } else {
      // Select all in this category
      setSelectedPermissions(prev => {
        const newIds = categoryPermissionIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
      toast.success(`Selected all ${formatCategoryName(categoryName)} permissions`);
    }
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      
      await axiosInstance.put(`/roles/${selectedRole._id}/permissions`, {
        permissionIds: selectedPermissions
      });

      setEditDialogOpen(false);
      setSelectedRole(null);
      setPermissionSearch('');
      await fetchData(); // Refresh the data
      toast.success(`Successfully updated permissions for ${formatRole(selectedRole.role_name)}`);
    } catch (error) {
      console.error('Failed to update permissions:', error);
      toast.error(error.response?.data?.message || 'Failed to update permissions');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleClose = () => {
    setEditDialogOpen(false);
    setSelectedRole(null);
    setPermissionSearch('');
  };

  // Helper functions
  const getPermissionCategory = (permission) => {
    return permission.category || 'general';
  };

  const groupPermissionsByCategory = () => {
    const grouped = {};
    
    // Filter permissions by search
    const filteredPermissions = permissions.filter(permission => {
      const searchLower = permissionSearch.toLowerCase();
      return (
        permission.name.toLowerCase().includes(searchLower) ||
        permission.description.toLowerCase().includes(searchLower) ||
        getPermissionCategory(permission).toLowerCase().includes(searchLower)
      );
    });
    
    filteredPermissions.forEach(permission => {
      const category = getPermissionCategory(permission);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    });
    
    return grouped;
  };

  const getRoleColor = (roleName) => {
    switch (roleName) {
      case 'super_admin': return 'error';
      case 'admin': return 'warning';
      case 'user': return 'info';
      default: return 'default';
    }
  };

  const formatRole = (roleName) => {
    return roleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatCategoryName = (categoryName) => {
    return categoryName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatPermission = (permission) => {
    return permission.description || permission.name;
  };

  const handleCategoryToggle = (category) => {
    setExpandedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Calculate stats
  const getTotalPermissions = () => permissions.length;
  const getActiveRoles = () => roles.filter(r => !r.deleted_at).length;
  const getAveragePermissionsPerRole = () => {
    const total = Object.values(rolePermissions).reduce((sum, perms) => sum + perms.length, 0);
    return roles.length > 0 ? Math.round(total / roles.length) : 0;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={50} />
      </Box>
    );
  }

  const groupedPermissions = groupPermissionsByCategory();

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom color="text.primary">
            Roles & Permissions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage role permissions and access control
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <SecurityIcon color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Total Permissions
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {getTotalPermissions()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CheckCircleIcon color="success" />
                <Typography variant="body2" color="text.secondary">
                  Active Roles
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {getActiveRoles()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <SecurityIcon color="info" />
                <Typography variant="body2" color="text.secondary">
                  Avg Permissions/Role
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {getAveragePermissionsPerRole()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Roles Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Permissions Count</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role._id} hover>
                  <TableCell>
                    <Chip 
                      label={formatRole(role.role_name)}
                      color={getRoleColor(role.role_name)}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <SecurityIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {rolePermissions[role._id]?.length || 0} permissions
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label="Active"
                      color="success"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={role.role_name === 'super_admin' ? 'Super Admin role is protected' : 'Edit Permissions'}>
                      <span>
                        <IconButton 
                          color="primary"
                          onClick={() => handleEditClick(role)}
                          disabled={role.role_name === 'super_admin'}
                        >
                          <EditIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Edit Permissions
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Managing permissions for: {selectedRole && <Chip 
                label={formatRole(selectedRole.role_name)}
                color={getRoleColor(selectedRole.role_name)}
                size="small"
                sx={{ ml: 1, fontWeight: 'bold' }}
              />}
            </Typography>
          </Box>
          
          {/* Search Field */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search permissions..."
            value={permissionSearch}
            onChange={(e) => setPermissionSearch(e.target.value)}
            sx={{ mt: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          
          {/* Selected Count */}
          <Box mt={2} display="flex" alignItems="center" gap={2}>
            <Chip
              icon={<CheckCircleIcon />}
              label={`${selectedPermissions.length} / ${permissions.length} selected`}
              color="primary"
              variant="outlined"
            />
          </Box>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent>
          {Object.keys(groupedPermissions).length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No permissions found matching "{permissionSearch}"
            </Alert>
          ) : (
            Object.entries(groupedPermissions)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, categoryPermissions]) => (
                <Accordion 
                  key={category}
                  expanded={expandedCategories.includes(category)}
                  onChange={() => handleCategoryToggle(category)}
                  sx={{ 
                    mb: 1,
                    '&:before': { display: 'none' },
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" pr={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {formatCategoryName(category)}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          size="small"
                          label={`${categoryPermissions.filter(p => selectedPermissions.includes(p._id)).length}/${categoryPermissions.length}`}
                          color={categoryPermissions.every(p => selectedPermissions.includes(p._id)) ? 'success' : 'default'}
                          variant="outlined"
                        />
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategorySelectAll(categoryPermissions, category);
                          }}
                        >
                          <SelectAllIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      {categoryPermissions.map((permission) => (
                        <FormControlLabel
                          key={permission._id}
                          control={
                            <Checkbox
                              checked={selectedPermissions.includes(permission._id)}
                              onChange={() => handlePermissionToggle(permission._id)}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {permission.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatPermission(permission)}
                              </Typography>
                            </Box>
                          }
                          sx={{
                            m: 0,
                            p: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            '&:hover': {
                              bgcolor: 'action.hover'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))
          )}
        </DialogContent>
        
        <Divider />
        
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleClose}
            variant="outlined"
            disabled={saveLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            variant="contained"
            disabled={saveLoading}
            startIcon={saveLoading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          >
            {saveLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
