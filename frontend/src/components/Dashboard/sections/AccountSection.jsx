import React, { useState } from 'react';
import { 
  Box, Paper, Typography, Avatar, Chip, Divider, Alert, TextField, 
  Grid, Button, CircularProgress, Switch, FormControlLabel,
  Card, CardContent
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function AccountSection({ user, setUser, profileError, savingProfile, handleSaveProfile }) {
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  const handleThemeToggle = () => {
    const newTheme = darkMode ? 'light' : 'dark';
    setDarkMode(!darkMode);
    localStorage.setItem('theme', newTheme);
    window.location.reload();
  };

  const handleOpenChangePassword = () => {
    window.dispatchEvent(new Event('openChangePassword'));
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, sm: 3, md: 4, lg: 5 }, 
        borderRadius: { xs: 2, md: 3 },
        background: (t) => t.palette.background.paper,
        border: (t) => `1px solid ${alpha(t.palette.divider, 0.1)}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }
      }}
    >
      {/* Header - Responsive */}
      <Box sx={{ 
        mb: { xs: 3, sm: 4, md: 5 },
        animation: 'slideIn 0.7s ease-out',
        '@keyframes slideIn': {
          from: { opacity: 0, transform: 'translateX(-20px)' },
          to: { opacity: 1, transform: 'translateX(0)' }
        }
      }}>
        <Box 
          display="flex" 
          flexDirection={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          gap={{ xs: 2, sm: 3 }} 
          mb={2}
        >
          <Avatar 
            sx={{ 
              width: { xs: 64, sm: 72, md: 80 }, 
              height: { xs: 64, sm: 72, md: 80 },
              bgcolor: 'primary.main',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 800,
              color: 'primary.contrastText',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
            }}
          >
            {user?.fullName?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Box flex={1}>
            <Typography 
              variant="h5" 
              fontWeight={800}
              sx={{ 
                mb: 0.5,
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                lineHeight: 1.2,
              }}
            >
              {user?.fullName || 'User'}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 1.5,
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                wordBreak: 'break-word',
              }}
            >
              {user?.email}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(user?.roles || []).map((r) => (
                <Chip 
                  key={r} 
                  label={r} 
                  size="small" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    background: (t) => alpha(t.palette.primary.main, 0.08),
                    border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.2)}`,
                  }} 
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Profile Info Section - Responsive */}
      <Box sx={{ 
        mb: { xs: 3, md: 4 },
        animation: 'fadeInUp 0.8s ease-out 0.2s backwards',
      }}>
        <Typography 
          variant="h6" 
          fontWeight={800} 
          sx={{ 
            mb: { xs: 2.5, md: 3.5 },
            fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.375rem' },
          }}
        >
          Personal Information
        </Typography>
        
        {profileError && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              animation: 'shake 0.5s ease',
              '@keyframes shake': {
                '0%, 100%': { transform: 'translateX(0)' },
                '25%': { transform: 'translateX(-8px)' },
                '75%': { transform: 'translateX(8px)' }
              }
            }}
          >
            {profileError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSaveProfile}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                }
              }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  fontWeight={700} 
                  sx={{ 
                    mb: 1, 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    textTransform: 'uppercase', 
                    letterSpacing: 1.2,
                  }}
                >
                  <EditIcon sx={{ fontSize: 14 }} />
                  Full Name
                </Typography>
                <TextField 
                  fullWidth 
                  name="fullName"
                  defaultValue={user?.fullName || ''}
                  onChange={(e) => {
                    setUser((u) => ({ ...u, fullName: e.target.value }));
                  }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  fontWeight={700} 
                  sx={{ 
                    mb: 1, 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    textTransform: 'uppercase', 
                    letterSpacing: 1.2,
                  }}
                >
                  <LockIcon sx={{ fontSize: 14 }} />
                  Email Address
                </Typography>
                <Box sx={{ 
                  p: 1.8, 
                  borderRadius: 2.5,
                  bgcolor: (t) => alpha(t.palette.action.disabled, 0.04),
                  border: (t) => `1px dashed ${alpha(t.palette.divider, 0.15)}`,
                  filter: 'blur(0.4px)',
                  opacity: 0.65,
                  transition: 'all 0.3s ease',
                  fontSize: '1.05rem',
                  '&:hover': {
                    opacity: 0.8,
                    filter: 'blur(0.3px)',
                  }
                }}>
                  <Typography variant="body1" fontWeight={500}>{user?.email}</Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                type="submit" 
                variant="contained" 
                size="large"
                disabled={savingProfile}
                startIcon={savingProfile ? <CircularProgress size={20} /> : <EditIcon />}
                sx={{ 
                  mt: 2,
                  px: 5,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  boxShadow: (t) => `0 4px 14px ${alpha(t.palette.primary.main, 0.3)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: (t) => `0 6px 20px ${alpha(t.palette.primary.main, 0.4)}`,
                  }
                }}
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Appearance Settings */}
      <Box sx={{ 
        mb: 4,
        animation: 'fadeInUp 0.8s ease-out 0.3s backwards',
      }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 3.5 }}>Appearance</Typography>
        
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            border: (t) => `1px solid ${t.palette.divider}`,
            background: (t) => alpha(t.palette.background.paper, 0.6),
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <Box 
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                  }}
                >
                  {darkMode ? <DarkModeIcon color="primary" /> : <LightModeIcon color="primary" />}
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={700}>
                    Theme Mode
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {darkMode ? 'Dark mode is enabled' : 'Light mode is enabled'}
                  </Typography>
                </Box>
              </Box>
              <FormControlLabel
                control={
                  <Switch 
                    checked={darkMode} 
                    onChange={handleThemeToggle}
                    color="primary"
                  />
                }
                label=""
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Security Section */}
      <Box sx={{ 
        animation: 'fadeInUp 0.8s ease-out 0.4s backwards',
      }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 3.5 }}>Security</Typography>
        
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            border: (t) => `1px solid ${t.palette.divider}`,
            background: (t) => alpha(t.palette.background.paper, 0.6),
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: (t) => `0 8px 24px ${alpha(t.palette.error.main, 0.15)}`,
              borderColor: (t) => alpha(t.palette.error.main, 0.3),
            }
          }}
          onClick={handleOpenChangePassword}
        >
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <Box 
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: (t) => alpha(t.palette.error.main, 0.1),
                  }}
                >
                  <VpnKeyIcon color="error" />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={700}>
                    Change Password
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Update your password to keep your account secure
                  </Typography>
                </Box>
              </Box>
              <ArrowForwardIcon sx={{ color: 'text.secondary' }} />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Paper>
  );
}
