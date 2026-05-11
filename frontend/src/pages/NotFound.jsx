import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 520,
          width: '100%',
          p: 4,
          textAlign: 'center',
          borderRadius: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
          background: (t) => t.palette.background.paper,
        }}
      >
        <Typography
          variant="h2"
          fontWeight={900}
          sx={{
            mb: 1,
            background: (t) =>
              `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
          Page not found or access denied
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The page you’re trying to reach doesn’t exist, or you don’t have permission to view it.
          Please sign in again or return to the homepage.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/signin')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Go to Sign In
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Back to Home
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

