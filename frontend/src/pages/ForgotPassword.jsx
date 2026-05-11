import React, { useState } from 'react';
import { Stack, Typography } from '@mui/material';
import ForgotPasswordForm from '../components/SignIn/ForgotPasswordForm';
import { useTheme } from '../contexts/useThemeContext';

export default function ForgotPassword() {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { isDarkMode } = useTheme();
  
  return (
    <Stack
      direction="column"
      component="main"
      sx={[
        {
          justifyContent: 'center',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
        },
        {
          '&::before': {
            content: '""',
            position: 'absolute',
            zIndex: -1,
            inset: 0,
            backgroundImage: isDarkMode 
              ? 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))'
              : 'radial-gradient(at 50% 50%, hsla(210, 100%, 90%, 0.5), hsl(220, 30%, 95%))',
          },
        },
      ]}
    >
        <Stack
          direction="column"
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
            p: 4,
            mx: 'auto',
            width: '100%',
            maxWidth: 400,
          }}
        >
          <ForgotPasswordForm setSuccess={setSuccess} setError={setError} />
        </Stack>
        {success && <Typography color="success.main" textAlign="center">{success}</Typography>}
        {error && <Typography color="error.main" textAlign="center">{error}</Typography>}
      </Stack>
  );
}
