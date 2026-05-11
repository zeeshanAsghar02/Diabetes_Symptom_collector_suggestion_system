import React, { useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { Paper, Typography, TextField, Button, Alert } from '@mui/material';

export default function ResetPasswordForm({ token, setSuccess, setError, navigate }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const validate = () => {
    if (!password || !confirmPassword) {
      setLocalError('All fields are required.');
      return false;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return false;
    }
    setLocalError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
      setSuccess(res.data.message || 'Your password has been reset. You can now log in.');
      setTimeout(() => navigate('/signin'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        p: 4,
        width: 360,
        backgroundColor: 'background.paper',
        borderRadius: 3,
        color: 'text.primary',
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Reset Password
      </Typography>
      {localError && <Alert severity="error" sx={{ mb: 2 }}>{localError}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="New Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={e => setPassword(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <TextField
          label="Confirm Password"
          type="password"
          fullWidth
          margin="normal"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <Button
          variant="contained"
          fullWidth
          sx={{
            mt: 2,
            fontWeight: 'bold',
            borderRadius: 2,
          }}
          type="submit"
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </Paper>
  );
}
