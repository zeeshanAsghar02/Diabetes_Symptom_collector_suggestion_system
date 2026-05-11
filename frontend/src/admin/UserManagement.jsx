import React, { useEffect, useState } from 'react';
import { useDateFormat } from '../hooks/useDateFormat';
import {
  Box, Typography, Button, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel, MenuItem, CircularProgress, Tooltip, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, alpha, InputAdornment, Pagination, Grid, Card, CardContent, Divider, LinearProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../utils/axiosInstance';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const passwordRequirements = [
  { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
  { label: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
  { label: 'One number', test: (pwd) => /\d/.test(pwd) },
  { label: 'One special character', test: (pwd) => /[^A-Za-z0-9]/.test(pwd) },
];

function UserFormDialog({ open, onClose, onSubmit, initialData, isSuperAdmin, roles, currentUserId }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    date_of_birth: null,
    isActivated: true,
    role: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isEditingSelf = initialData?._id === currentUserId;
  const isEditingSuperAdmin = initialData?.roles?.includes('super_admin');
  const isAddingUser = !initialData;

  useEffect(() => {
    if (initialData) {
      setForm({
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        password: '',
        confirmPassword: '',
        gender: initialData.gender || '',
        date_of_birth: initialData.date_of_birth ? new Date(initialData.date_of_birth) : null,
        isActivated: initialData.isActivated,
        role: initialData.roles?.[0] || ''
      });
    } else {
      setForm({ fullName: '', email: '', password: '', confirmPassword: '', gender: '', date_of_birth: null, isActivated: true, role: 'user' });
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleDateChange = (newDate) => {
    setForm((prev) => ({ ...prev, date_of_birth: newDate }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (isAddingUser) {
      if (!form.password) {
        toast.error('Password is required');
        return;
      }
      
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
      if (!passwordRegex.test(form.password)) {
        toast.error('Password does not meet requirements');
        return;
      }

      if (form.password !== form.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    if (!form.gender) {
      toast.error('Gender is required');
      return;
    }

    if (!form.date_of_birth) {
      toast.error('Date of birth is required');
      return;
    }

    const today = new Date();
    const minAge = new Date(today.getFullYear() - 11, today.getMonth(), today.getDate());
    if (form.date_of_birth > minAge) {
      toast.error('User must be at least 11 years old');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(form);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const formatRole = (roleName) => {
    return roleName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPasswordStrength = () => {
    const passed = passwordRequirements.filter(req => req.test(form.password)).length;
    return (passed / passwordRequirements.length) * 100;
  };

  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 11, today.getMonth(), today.getDate());

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 24,
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        fontWeight: 700,
        fontSize: '1.5rem',
        background: (t) => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        {initialData ? '✏️ Edit User' : '➕ Add New User'}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        {/* Full Name */}
        <TextField
          label="Full Name"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="primary" />
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              backgroundColor: (t) => alpha(t.palette.background.default, 0.5),
            }
          }}
        />

        {/* Email */}
        <TextField
          label="Email Address"
          name="email"
          value={form.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
          type="email"
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="primary" />
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              backgroundColor: (t) => alpha(t.palette.background.default, 0.5),
            }
          }}
        />

        {/* Password fields - only for new users */}
        {isAddingUser && (
          <>
            <TextField
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  backgroundColor: (t) => alpha(t.palette.background.default, 0.5),
                }
              }}
            />
            
            {/* Password Strength Indicator */}
            {form.password && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={getPasswordStrength()} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: (t) => alpha(t.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      backgroundColor: getPasswordStrength() >= 80 ? 'success.main' : 
                                     getPasswordStrength() >= 50 ? 'warning.main' : 'error.main',
                    }
                  }} 
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {passwordRequirements.map((req, idx) => (
                    <Chip
                      key={idx}
                      icon={req.test(form.password) ? <CheckCircleIcon /> : undefined}
                      label={req.label}
                      size="small"
                      color={req.test(form.password) ? 'success' : 'default'}
                      variant={req.test(form.password) ? 'filled' : 'outlined'}
                      sx={{ fontSize: '0.7rem', height: 24 }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <TextField
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              error={form.confirmPassword && form.password !== form.confirmPassword}
              helperText={form.confirmPassword && form.password !== form.confirmPassword ? 'Passwords do not match' : ''}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  backgroundColor: (t) => alpha(t.palette.background.default, 0.5),
                }
              }}
            />
          </>
        )}

        {/* Date of Birth */}
        <Box sx={{ mt: 2, mb: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date of Birth"
              value={form.date_of_birth}
              onChange={handleDateChange}
              maxDate={maxDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon color="primary" />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      backgroundColor: (t) => alpha(t.palette.background.default, 0.5),
                    }
                  },
                },
              }}
            />
          </LocalizationProvider>
        </Box>

        {/* Gender */}
        <TextField
          select
          label="Gender"
          name="gender"
          value={form.gender}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: (t) => alpha(t.palette.background.default, 0.5),
            }
          }}
        >
          {GENDER_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>

        <FormControlLabel
          control={<Switch checked={form.isActivated} onChange={handleChange} name="isActivated" />}
          label="Account Activated"
          sx={{ mt: 2 }}
        />
        
        {/* Role selection - only visible to super admins */}
        {isSuperAdmin ? (
          <>
            {isEditingSelf && isEditingSuperAdmin ? (
              <Box sx={{ mt: 2, mb: 1, p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={700}>
                  ⚠️ WARNING: You are editing your own Super Admin account
                </Typography>
                <Typography variant="caption">
                  Changing your role will immediately revoke your Super Admin privileges!
                </Typography>
              </Box>
            ) : isEditingSuperAdmin ? (
              <Box sx={{ mt: 2, mb: 1, p: 2, bgcolor: 'warning.main', color: 'white', borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={700}>
                  🛡️ PROTECTED: You are editing another Super Admin
                </Typography>
                <Typography variant="caption">
                  You cannot change another Super Admin's role
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="primary.main" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                ✨ Super Admin: You can change this user's role
              </Typography>
            )}
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={form.role}
                onChange={handleChange}
                label="Role"
                disabled={isEditingSuperAdmin && !isEditingSelf}
                sx={{
                  borderRadius: 2,
                  backgroundColor: (t) => alpha(t.palette.background.default, 0.5),
                }}
              >
                {roles.map((role) => (
                  <MenuItem 
                    key={role._id} 
                    value={role.role_name}
                    disabled={isEditingSelf && isEditingSuperAdmin && role.role_name !== 'super_admin'}
                  >
                    {formatRole(role.role_name)}
                    {isEditingSelf && isEditingSuperAdmin && role.role_name !== 'super_admin' && " (Cannot downgrade yourself)"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1, fontStyle: 'italic' }}>
            ℹ️ Note: Only Super Admins can change user roles
          </Typography>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            px: 4,
            background: (t) => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 4,
            }
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : (initialData ? '💾 Update User' : '➕ Create User')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 24,
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        fontWeight: 700,
        fontSize: '1.25rem',
        color: 'error.main'
      }}>
        {title || 'Confirm'}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <Typography sx={{ fontWeight: 500 }}>
          {message || 'Are you sure?'}
        </Typography>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          variant="contained"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 4,
            }
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function UserManagement() {
  const { formatDate } = useDateFormat();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [currentUserRoles, setCurrentUserRoles] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/users/allUsers');
      const usersData = res.data.data.filter(u => !u.deleted_at);
      setUsers(usersData);
      setFilteredUsers(usersData);
      setLastUpdated(new Date());
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      if (currentUserRoles.includes('super_admin')) {
        const res = await axiosInstance.get('/roles');
        setRoles(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const loadCurrentUserRoles = async () => {
    try {
      const res = await axiosInstance.get('/users/roles');
      setCurrentUserRoles(res.data.data);
    } catch (err) {
      console.error('Failed to fetch current user roles:', err);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const res = await axiosInstance.get('/auth/profile');
      setCurrentUserId(res.data.data.user.id);
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  };

  useEffect(() => {
    loadUsers();
    loadCurrentUserRoles();
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserRoles.includes('super_admin')) {
      loadRoles();
    }
  }, [currentUserRoles]);

  // Filter logic
  useEffect(() => {
    let result = users;

    // Search filter
    if (searchQuery) {
      result = result.filter(user => 
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      result = result.filter(user => user.roles?.includes(filterRole));
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(user => 
        filterStatus === 'active' ? user.isActivated : !user.isActivated
      );
    }

    setFilteredUsers(result);
    setPage(1); // Reset to first page when filters change
  }, [searchQuery, filterRole, filterStatus, users]);

  const handleAdd = () => {
    setEditData(null);
    setFormOpen(true);
  };

  const handleEdit = (user) => {
    if (isSuperAdmin && user.roles?.includes('super_admin') && user._id !== currentUserId) {
      toast.error('You cannot edit another Super Admin\'s details');
      return;
    }
    setEditData(user);
    setFormOpen(true);
  };

  const handleDelete = (id) => {
    const user = users.find(u => u._id === id);
    
    if (user?.roles?.includes('super_admin')) {
      toast.error('Super Admins cannot be deleted! This is a protected role.');
      return;
    }
    
    if (id === currentUserId) {
      toast.error('You cannot delete your own account!');
      return;
    }
    
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editData) {
        // Validation for editing
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (data.email && !emailRegex.test(data.email)) {
          toast.error('Please enter a valid email address');
          return;
        }

        // Super admin protections
        if (editData._id === currentUserId && editData.roles?.includes('super_admin') && data.role && data.role !== 'super_admin') {
          toast.error('You cannot downgrade your own Super Admin role! This would lock you out.');
          return;
        }

        if (editData.roles?.includes('super_admin') && editData._id !== currentUserId && data.role && data.role !== 'super_admin') {
          toast.error('You cannot change another Super Admin\'s role!');
          return;
        }

        // Update user details
        await axiosInstance.put(`/users/updateUser/${editData._id}`, {
          fullName: data.fullName,
          email: data.email,
          gender: data.gender,
          date_of_birth: data.date_of_birth,
          isActivated: data.isActivated
        });

        // Update user role if super admin and role changed
        if (isSuperAdmin && data.role && data.role !== editData.roles?.[0]) {
          await axiosInstance.put(`/users/updateUserRole/${editData._id}`, {
            role: data.role
          });
        }

        toast.success('✅ User updated successfully');
      } else {
        // Create new user
        await axiosInstance.post('/auth/register', {
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          gender: data.gender,
          date_of_birth: data.date_of_birth,
        });

        toast.success('✅ User created successfully! Activation email sent.');
      }
      setFormOpen(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await axiosInstance.delete(`/users/deleteUser/${deleteId}`);
      toast.success('✅ User deleted successfully');
      setDeleteId(null);
      setConfirmOpen(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleQuickToggleActivation = async (user) => {
    try {
      await axiosInstance.put(`/users/updateUser/${user._id}`, {
        fullName: user.fullName,
        email: user.email,
        isActivated: !user.isActivated
      });
      toast.success(`User ${!user.isActivated ? 'activated' : 'deactivated'} successfully`);
      loadUsers();
    } catch (err) {
      toast.error('Failed to toggle user status');
    }
  };

  const handleRefresh = () => {
    toast.info('🔄 Refreshing user list...');
    loadUsers();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterRole('all');
    setFilterStatus('all');
  };

  const isSuperAdmin = currentUserRoles.includes('super_admin');

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.isActivated).length,
    inactive: users.filter(u => !u.isActivated).length,
    superAdmins: users.filter(u => u.roles?.includes('super_admin')).length,
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={900} gutterBottom color="text.primary">
            User Management
          </Typography>
          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
            <Chip 
              label={isSuperAdmin ? "Super Admin Mode: Full Access" : "Admin Mode: Limited Access"}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 600 }}
            />
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2,
          bgcolor: 'background.paper',
          border: (t) => `1px solid ${t.palette.divider}`,
          borderRadius: 3,
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Total Users
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight={700} color="primary.main" sx={{ mb: 0.5 }}>
                {stats.active}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Active
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                {stats.inactive}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Inactive
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                {stats.superAdmins}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Super Admins
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          background: (t) => t.palette.background.paper,
          border: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' }} gap={2}>
          <TextField
            size="small"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setPage(1);
              setSearchQuery(e.target.value);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small">
            <InputLabel>Filter by Role</InputLabel>
            <Select
              value={filterRole}
              label="Filter by Role"
              onChange={(e) => {
                setPage(1);
                setFilterRole(e.target.value);
              }}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="super_admin">Super Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={filterStatus}
              label="Filter by Status"
              onChange={(e) => {
                setPage(1);
                setFilterStatus(e.target.value);
              }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={handleClearFilters}
            size="small"
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table size="small" sx={{ tableLayout: 'auto' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Full Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date of Birth</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Roles</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user) => {
                    const isCurrentUser = user._id === currentUserId;
                    const isSuperAdminUser = user.roles?.includes('super_admin');
                    const canDelete = !isSuperAdminUser && !isCurrentUser;
                    
                    return (
                      <TableRow 
                        key={user._id} 
                        hover
                        sx={{ 
                          bgcolor: isCurrentUser ? (t) => alpha(t.palette.primary.main, 0.04) : 'transparent',
                        }}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {user.fullName}
                            {isCurrentUser && (
                              <Chip 
                                label="You" 
                                size="small" 
                                variant="outlined"
                                color="primary"
                                sx={{ 
                                  height: 20,
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', maxWidth: 200 }}>
                          <Tooltip title={user.email}>
                            <Typography variant="body2" noWrap>
                              {user.email}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.gender} 
                            size="small"
                            variant="outlined"
                            sx={{ 
                              textTransform: 'capitalize',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>
                          {user.date_of_birth ? formatDate(user.date_of_birth) : '—'}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Click to toggle status">
                            <Chip 
                              label={user.isActivated ? "Active" : "Inactive"}
                              color={user.isActivated ? "success" : "default"}
                              size="small"
                              variant="outlined"
                              onClick={() => handleQuickToggleActivation(user)}
                              sx={{ 
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            {Array.isArray(user.roles) && user.roles.map(role => (
                              <Chip 
                                key={role} 
                                label={role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                                size="small"
                                color={role === 'super_admin' ? 'error' : role === 'admin' ? 'primary' : 'default'}
                                variant="filled"
                                sx={{ 
                                  fontWeight: 600,
                                }} 
                              />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" gap={0.5} justifyContent="flex-end" alignItems="center">
                            <Tooltip title={isSuperAdminUser && !isCurrentUser ? "Cannot edit other Super Admins" : "Edit User"} arrow>
                              <span>
                                <IconButton 
                                  size="small"
                                  onClick={() => handleEdit(user)}
                                  disabled={isSuperAdminUser && !isCurrentUser}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip 
                              title={
                                isSuperAdminUser 
                                  ? "Super Admins cannot be deleted"
                                  : isCurrentUser
                                  ? "You cannot delete yourself"
                                  : "Delete User"
                              } 
                              arrow
                            >
                              <span>
                                <IconButton 
                                  size="small"
                                  onClick={() => handleDelete(user._id)}
                                  disabled={!canDelete}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            {isSuperAdminUser && (
                              <Chip 
                                label="Protected" 
                                size="small" 
                                variant="outlined"
                                color="error"
                                sx={{ 
                                  ml: 1, 
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  height: 20,
                                }} 
                              />
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
              <Typography variant="body2" color="text.secondary">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
              </Typography>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="small"
              />
            </Box>
          </>
        )}
      </Paper>

      <UserFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editData}
        isSuperAdmin={isSuperAdmin}
        roles={roles}
        currentUserId={currentUserId}
      />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="🗑️ Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />
    </Box>
  );
}
