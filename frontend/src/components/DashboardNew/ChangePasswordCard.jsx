import React, { useState } from 'react';
import { Paper, Box, Typography, TextField, Button, Alert, LinearProgress, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const passwordRequirements = [
  { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
  { label: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
  { label: 'One number', test: (pwd) => /\d/.test(pwd) },
  { label: 'One special character', test: (pwd) => /[^A-Za-z0-9]/.test(pwd) },
];

const ChangePasswordCard = ({ onSubmit, loading, error, success }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const getPasswordStrength = () => {
    const passed = passwordRequirements.filter((req) => req.test(form.newPassword)).length;
    return (passed / passwordRequirements.length) * 100;
  };

  const canSubmit = () => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    return (
      form.currentPassword &&
      form.newPassword &&
      passwordRegex.test(form.newPassword) &&
      form.newPassword === form.confirm
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit()) return;
    onSubmit?.(form.currentPassword, form.newPassword);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 4,
        background: (t) => `linear-gradient(135deg, ${t.palette.background.paper}, ${alpha(t.palette.secondary.main, 0.04)})`,
        border: (t) => `2px solid ${alpha(t.palette.secondary.main, 0.15)}`,
      }}
    >
      <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>Security</Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>Password changed successfully.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit}>
        <TextField fullWidth label="Current Password" name="currentPassword" type="password" sx={{ mb: 2 }} value={form.currentPassword} onChange={handleChange} />
        <TextField
          fullWidth
          label="New Password"
          name="newPassword"
          type="password"
          sx={{ mb: 2 }}
          value={form.newPassword}
          onChange={handleChange}
        />
        {form.newPassword && (
          <Box sx={{ mt: -1, mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={getPasswordStrength()}
              sx={{
                height: 6,
                backgroundColor: (t) => alpha(t.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getPasswordStrength() >= 80 ? 'success.main' : getPasswordStrength() >= 50 ? 'warning.main' : 'error.main',
                },
              }}
            />
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {passwordRequirements.map((req, idx) => (
                <Chip
                  key={idx}
                  icon={req.test(form.newPassword) ? <CheckCircleIcon /> : undefined}
                  label={req.label}
                  size="small"
                  color={req.test(form.newPassword) ? 'success' : 'default'}
                  variant={req.test(form.newPassword) ? 'filled' : 'outlined'}
                  sx={{ fontSize: '0.7rem', height: 24 }}
                />
              ))}
            </Box>
          </Box>
        )}
        <TextField fullWidth label="Confirm New Password" name="confirm" type="password" sx={{ mb: 2 }} value={form.confirm} onChange={handleChange} />
        <Button type="submit" variant="contained" disabled={!canSubmit() || loading}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 800,
            background: (t) => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
          }}
        >
          {loading ? 'Updating…' : 'Change Password'}
        </Button>
      </Box>
    </Paper>
  );
};

export default ChangePasswordCard;
