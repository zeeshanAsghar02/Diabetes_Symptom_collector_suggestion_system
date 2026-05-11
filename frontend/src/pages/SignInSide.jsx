import React, { useState } from 'react';
import { Stack, Typography, Box, alpha, Card, CardContent, Button } from '@mui/material';
import { motion } from 'framer-motion';
import SignInForm from '../components/SignIn/SignInForm';
import DiabetesImageSlider from '../components/Common/DiabetesImageSlider';
import AuthBackground from '../components/Common/AuthBackground';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/useThemeContext';
import { useSettings } from '../context/SettingsContext';
import SecurityIcon from '@mui/icons-material/Security';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';

export default function SignInSide() {
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
            <SignInForm setSuccess={setSuccess} setError={setError} navigate={navigate} />
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
              <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                <DiabetesImageSlider />
                
                {/* Badge Cards */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    width: '100%',
                    maxWidth: 500,
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  {[
                    { icon: SecurityIcon, label: 'Secure', color: 'success' },
                    { icon: AccessibilityIcon, label: 'Accessible', color: 'info' },
                    { icon: FavoriteIcon, label: 'Diabetic Partner', color: 'error' },
                  ].map((badge, index) => {
                    const BadgeIcon = badge.icon;
                    return (
                    <motion.div
                      key={badge.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    >
                      <Card
                        elevation={0}
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          backgroundColor: alpha(theme.palette.background.paper, 0.8),
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette[badge.color].main, 0.2)}`,
                            borderColor: alpha(theme.palette[badge.color].main, 0.3),
                          },
                        }}
                      >
                        <CardContent sx={{ p: '8px !important', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BadgeIcon
                            sx={{
                              fontSize: 18,
                              color: `${badge.color}.main`,
                            }}
                          />
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            sx={{
                              fontSize: '0.75rem',
                              color: 'text.primary',
                            }}
                          >
                            {badge.label}
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                    );
                  })}
                </Box>
              </Box>
            </motion.div>
          </Box>
        </Stack>
      </Stack>
  );
}
