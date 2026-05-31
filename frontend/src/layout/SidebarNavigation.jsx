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
  IconButton,
  Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FavoriteIcon from '@mui/icons-material/Favorite';
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
    Overview: 'Overview',
    'Care Plan': 'Care Plan',
    'Check My Risk': 'Check My Risk',
    'My Disease Data': 'My Data',
    Feedback: 'Feedback',
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
          background: '#0B0F19',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: 'none',
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
              bgcolor: 'rgba(255, 255, 255, 0.04)',
            },
          }}
        >
          <Avatar
            sx={{
              width: 28,
              height: 28,
              background: 'rgba(34, 211, 238, 0.1)',
              color: '#67E8F9',
              border: '1px solid rgba(103, 232, 249, 0.28)',
              fontWeight: 700,
              fontSize: '0.92rem',
            }}
          >
            <FavoriteIcon sx={{ fontSize: 16 }} />
          </Avatar>
          {sidebarOpen && (
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.95rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                Diavise
              </Typography>
              <Typography sx={{ color: '#67E8F9', fontWeight: 700, fontSize: '0.68rem', lineHeight: 1.1, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
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
                    borderRadius: 1.4,
                    mb: 0,
                    px: sidebarOpen ? 1.2 : 1,
                    py: 0.95,
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    '&.Mui-selected': {
                      bgcolor: 'transparent',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: -7,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 2,
                        height: 26,
                        borderRadius: 999,
                        bgcolor: '#22D3EE',
                        boxShadow: '0 0 18px rgba(34, 211, 238, 0.72)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: '#E0F2FE',
                      },
                      '& .MuiListItemText-primary': {
                        color: '#F8FAFC',
                        fontWeight: 780,
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.045)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: sidebarOpen ? 36 : 'auto',
                      color: 'rgba(203, 213, 225, 0.56)',
                      transition: 'color 0.2s ease',
                      justifyContent: 'center',
                    }}
                  >
                    {sec.icon}
                  </ListItemIcon>
                  {sidebarOpen && (
                    <ListItemText
                      primary={sec.label}
                      primaryTypographyProps={{
                        component: 'span',
                        fontWeight: 650,
                        fontSize: '0.72rem',
                        color: 'rgba(203, 213, 225, 0.58)',
                        letterSpacing: '0.01em',
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
                color: 'rgba(203, 213, 225, 0.58)',
                '&:hover': {
                  bgcolor: 'rgba(248, 113, 113, 0.1)',
                  color: '#FCA5A5',
                },
              }}
            >
              {sidebarOpen ? 'Logout' : <LogoutOutlinedIcon sx={{ fontSize: 17 }} />}
            </Button>
          </Tooltip>
        )}

        <Divider sx={{ mb: 0.9, borderColor: 'rgba(255, 255, 255, 0.06)' }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9 }}>
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'rgba(34, 211, 238, 0.12)', color: '#BAE6FD', border: '1px solid rgba(125, 211, 252, 0.32)', fontSize: '0.66rem', fontWeight: 800 }}>
              {user?.fullName?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            {sidebarOpen && (
              <Box>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 760, color: '#F8FAFC', lineHeight: 1.2, maxWidth: 116 }} noWrap>
                  {user?.fullName || user?.name || 'Patient'}
                </Typography>
                <Typography sx={{ fontSize: '0.56rem', color: 'rgba(203, 213, 225, 0.52)', lineHeight: 1.2, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Patient
                </Typography>
              </Box>
            )}
          </Box>
          {sidebarOpen && (
            <IconButton size="small" onClick={onSidebarToggle}>
              <KeyboardArrowDownIcon sx={{ fontSize: 18, color: 'rgba(203, 213, 225, 0.55)' }} />
            </IconButton>
          )}
          {!sidebarOpen && (
            <Tooltip title="Expand Sidebar" placement="right">
              <IconButton size="small" onClick={onSidebarToggle}>
                <ChevronRightIcon fontSize="small" sx={{ color: 'rgba(203, 213, 225, 0.55)' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
