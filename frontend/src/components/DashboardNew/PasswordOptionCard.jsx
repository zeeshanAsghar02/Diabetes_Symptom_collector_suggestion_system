import React from 'react';
import { Paper, Box, Typography, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import LockIcon from '@mui/icons-material/Lock';
const PasswordOptionCard = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 4,
        background: (t) => `linear-gradient(135deg, ${t.palette.background.paper}, ${alpha(t.palette.warning.main, 0.04)})`,
        border: (t) => `2px solid ${alpha(t.palette.warning.main, 0.15)}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: (t)=>alpha(t.palette.warning.main, 0.15), display:'flex', alignItems:'center', justifyContent:'center' }}>
          <LockIcon sx={{ color: 'warning.main' }} />
        </Box>
        <Typography variant="h6" fontWeight={900}>Password</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Manage your password using our secure password flow.
      </Typography>
      <Button
        variant="contained"
        onClick={() => window.dispatchEvent(new Event('openChangePassword'))}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 800,
          background: (t) => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
        }}
      >
        Change Password
      </Button>
    </Paper>
  );
};

export default PasswordOptionCard;
