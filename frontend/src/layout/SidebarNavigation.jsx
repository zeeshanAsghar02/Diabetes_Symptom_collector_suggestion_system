import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Paper,
  Box,
  Button,
  Tooltip,
  Badge,
  IconButton,
  Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';

const drawerWidth = 220;
const miniDrawerWidth = 64;

export default function SidebarNavigation({
  sections,
  selectedIndex,
  onSectionChange,
  sidebarOpen,
  onSidebarToggle,
  onLogout,
  user,
}) {
  const navigate = useNavigate();
  const labelMap = {
    Dashboard: 'Dashboard',
    'My Account': 'My Assessments',
    'Check My Risk': 'Check My Risk',
    'My Disease Data': 'My Data',
    'My Feedback': 'Messages',
  };

  const displaySections = sections.map((sec) => ({
    ...sec,
    label: labelMap[sec.label] || sec.label,
  }));

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: sidebarOpen ? drawerWidth : miniDrawerWidth,
        flexShrink: 0,
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: sidebarOpen ? drawerWidth : miniDrawerWidth,
          boxSizing: 'border-box',
          py: 2,
          px: sidebarOpen ? 1.25 : 0.75,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff',
          borderRight: (t) => `1px solid ${alpha(t.palette.divider, 0.9)}`,
          transition: 'width 0.3s ease, padding 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Brand */}
        <Box
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              navigate('/');
            }
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            gap: 1,
            px: sidebarOpen ? 1 : 0,
            py: 1.25,
            mb: 1.1,
            borderRadius: 1.5,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: alpha('#4F46E5', 0.06),
            },
          }}
        >
          <Avatar
            sx={{
              width: 28,
              height: 28,
              background: alpha('#4F46E5', 0.12),
              color: '#4F46E5',
              fontWeight: 700,
              fontSize: '0.92rem',
            }}
          >
            <FavoriteIcon sx={{ fontSize: 16 }} />
          </Avatar>
          {sidebarOpen && (
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.02rem', lineHeight: 1.1 }}>
                Diabetes
              </Typography>
              <Typography sx={{ color: '#4F46E5', fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.1 }}>
                Care
              </Typography>
            </Box>
          )}
        </Box>

        {/* Navigation */}
        <List
          sx={{
            px: 0,
            mt: 0.5,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            gap: 1,
          }}
        >
          {displaySections.map((sec, index) => (
            <Tooltip title={!sidebarOpen ? sec.label : ''} placement="right" key={`${sec.label}-${index}`}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedIndex === index}
                  onClick={() => onSectionChange(index)}
                  sx={{
                    borderRadius: 2,
                    mb: 0,
                    px: sidebarOpen ? 1.2 : 1,
                    py: 0.95,
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    transition: 'all 0.2s ease',
                    '&.Mui-selected': {
                      bgcolor: alpha('#4F46E5', 0.1),
                      '& .MuiListItemIcon-root': {
                        color: '#4F46E5',
                      },
                      '& .MuiListItemText-primary': {
                        color: '#4F46E5',
                        fontWeight: 700,
                      },
                    },
                    '&:hover': {
                      bgcolor: alpha('#4F46E5', 0.06),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: sidebarOpen ? 36 : 'auto',
                      color: '#64748B',
                      transition: 'color 0.2s ease',
                      justifyContent: 'center',
                    }}
                  >
                    {sec.label === 'Messages' ? (
                      <Badge
                        color="primary"
                        badgeContent={3}
                        sx={{ '& .MuiBadge-badge': { fontSize: '0.62rem', height: 16, minWidth: 16 } }}
                      >
                        {sec.icon}
                      </Badge>
                    ) : (
                      sec.icon
                    )}
                  </ListItemIcon>
                  {sidebarOpen && (
                    <ListItemText
                      primary={sec.label}
                      primaryTypographyProps={{
                        component: 'span',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        color: '#334155',
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Box>

      {/* Bottom area */}
      <Box sx={{ px: sidebarOpen ? 0.6 : 0 }}>
        {sidebarOpen && (
          <Paper
            elevation={0}
            sx={{
              p: 1.1,
              borderRadius: 2,
              background: alpha('#4F46E5', 0.06),
              border: `1px solid ${alpha('#4F46E5', 0.12)}`,
              mb: 1.2,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#4F46E5', 0.15), color: '#4F46E5' }}>
                <LocalHospitalOutlinedIcon sx={{ fontSize: 17 }} />
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                  Need help?
                </Typography>
                <Typography sx={{ fontSize: '0.66rem', color: '#64748B', mt: 0.25, lineHeight: 1.35 }}>
                  Talk to our diabetes care specialist.
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{
                    mt: 0.7,
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.64rem',
                    px: 1,
                    py: 0.15,
                  }}
                >
                  Contact Us
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        {typeof onLogout === 'function' && (
          <Tooltip title={!sidebarOpen ? 'Logout' : ''} placement="right">
            <Button
              fullWidth
              variant="text"
              startIcon={sidebarOpen ? <LogoutOutlinedIcon sx={{ fontSize: 16 }} /> : null}
              onClick={onLogout}
              sx={{
                mb: 0.9,
                borderRadius: 1.8,
                minWidth: sidebarOpen ? 'auto' : 38,
                px: sidebarOpen ? 1.1 : 0.8,
                py: 0.75,
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                textTransform: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#64748B',
                '&:hover': {
                  bgcolor: alpha('#EF4444', 0.1),
                  color: '#DC2626',
                },
              }}
            >
              {sidebarOpen ? 'Logout' : <LogoutOutlinedIcon sx={{ fontSize: 17 }} />}
            </Button>
          </Tooltip>
        )}

        <Divider sx={{ mb: 0.9 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9 }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: '#4F46E5', fontSize: '0.75rem' }}>
              {user?.fullName?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            {sidebarOpen && (
              <Box>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                  {user?.fullName || 'Sarah Khan'}
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: '#64748B', lineHeight: 1.2 }}>
                  Patient
                </Typography>
              </Box>
            )}
          </Box>
          {sidebarOpen && (
            <IconButton size="small" onClick={onSidebarToggle}>
              <KeyboardArrowDownIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
            </IconButton>
          )}
          {!sidebarOpen && (
            <Tooltip title="Expand Sidebar" placement="right">
              <IconButton size="small" onClick={onSidebarToggle}>
                <ChevronRightIcon fontSize="small" sx={{ color: '#94A3B8' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
