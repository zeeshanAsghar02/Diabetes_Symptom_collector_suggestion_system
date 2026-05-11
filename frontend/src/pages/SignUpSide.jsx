import React, { useState } from 'react';
import { Stack, Typography, Box, alpha, Button } from '@mui/material';
import { motion } from 'framer-motion';
import SignUpForm from '../components/SignUp/SignUpForm';
import DiabetesImageSlider from '../components/Common/DiabetesImageSlider';
import AuthBackground from '../components/Common/AuthBackground';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/useThemeContext';
import { useSettings } from '../context/SettingsContext';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';

export default function SignUpSide() {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isDarkMode, theme } = useTheme();
  const { siteTitle } = useSettings();

  return (
    <Stack
      direction="column"
      component="main"
      sx={{
        justifyContent: 'center',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: isDarkMode
          ? 'linear-gradient(135deg, #0b1220 0%, #1a1a2e 50%, #0a0a0a 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
      }}
    >
      <AuthBackground />
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'flex-start',
            pt: { xs: 1.5, sm: 2.2 },
            pl: { xs: 2, sm: 3.5, md: 5 },
          }}
        >
          <Button
            onClick={() => navigate('/')}
            startIcon={<HealthAndSafetyIcon sx={{ color: '#22D3EE' }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 999,
              px: 2.5,
              py: 0.9,
              color: '#0F172A',
              border: '1px solid rgba(34,211,238,0.38)',
              background: 'linear-gradient(135deg, rgba(34,211,238,0.16), rgba(163,230,53,0.18))',
              backdropFilter: 'blur(8px)',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(34,211,238,0.22), rgba(163,230,53,0.22))',
              },
            }}
          >
            {siteTitle || 'DiabetesCare'}
          </Button>
        </Box>
        <Box
          sx={{
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            px: { xs: 2, sm: 4 },
            pt: { xs: 2, sm: 3 },
          }}
        >
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.6rem' },
              mb: 1,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {(siteTitle || 'DiabetesCare')} Patient Registration
          </Typography>
          <Box
            sx={{
              width: '100%',
              maxWidth: 720,
              mx: 'auto',
              mt: 1,
              mb: { xs: 2, sm: 3 },
              p: { xs: 1.5, sm: 2 },
              borderRadius: 1.75,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              backgroundColor: alpha(theme.palette.background.paper, 0.72),
              backdropFilter: 'blur(10px)',
              boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.14)}`,
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
              Welcome to {siteTitle || 'DiabetesCare'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete your registration to get personalized diabetes insights and recommendations.
            </Typography>
          </Box>
        </Box>
        <Stack
          direction={{ xs: 'column-reverse', md: 'row' }}
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 4, md: 8 },
            p: { xs: 2, sm: 4 },
            mx: 'auto',
            width: '100%',
            maxWidth: 1200,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SignUpForm setSuccess={setSuccess} setError={setError} />
          </motion.div>
          <Box
            sx={{
              display: { xs: 'none', md: 'block' }
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Box display="flex" flexDirection="column" alignItems="center">
                <DiabetesImageSlider />
              </Box>
            </motion.div>
          </Box>
        </Stack>
      </Stack>
  );
}
