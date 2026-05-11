import React, { useState } from 'react';
import { Paper, Box, Avatar, Typography, Chip, Button, TextField, Grid, Alert } from '@mui/material';
import { alpha } from '@mui/material/styles';

const AccountProfileCard = ({ user, onSave, saving, error, canEdit }) => {
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    gender: user?.gender || '',
    date_of_birth: user?.date_of_birth || '',
  });
  const [dirty, setDirty] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setDirty(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) onSave({ fullName: form.fullName });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 4,
        background: (t) => `linear-gradient(135deg, ${t.palette.background.paper}, ${alpha(t.palette.primary.main, 0.04)})`,
        border: (t) => `2px solid ${alpha(t.palette.primary.main, 0.15)}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar sx={{ width: 64, height: 64 }}>
          {user?.fullName?.[0]?.toUpperCase() || 'U'}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={900}>{user?.fullName || 'User'}</Typography>
          <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {(user?.roles || []).map((r) => (
              <Chip key={r} label={r} size="small" color="primary" variant="outlined" />
            ))}
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Email" name="email" value={form.email} disabled 
              InputProps={{ readOnly: true }}
              sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: (t)=>t.palette.text.disabled, filter: 'blur(1px)' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Gender" name="gender" value={form.gender} disabled 
              InputProps={{ readOnly: true }}
              sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: (t)=>t.palette.text.disabled, filter: 'blur(1px)' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Date of Birth" type="date" name="date_of_birth" value={form.date_of_birth || ''} disabled 
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
              sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: (t)=>t.palette.text.disabled, filter: 'blur(1px)' } }}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button type="submit" variant="contained" disabled={!dirty || saving || !canEdit}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 800,
              background: (t) => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
            }}
          >
            {canEdit ? (saving ? 'Saving...' : 'Save Changes') : 'Read-only'}
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Only your name can be updated here. Other details are protected; contact support to request changes.
        </Typography>
      </Box>
    </Paper>
  );
};

export default AccountProfileCard;
