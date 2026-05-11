import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Box,
  Button,
} from '@mui/material';
import ThemeToggle from '../components/Common/ThemeToggle';

const drawerWidth = 220;

export default function MobileDrawer({
  open,
  onClose,
  sections,
  selectedIndex,
  onSectionChange,
  onLogout,
  user,
}) {
  const handleSectionClick = (index) => {
    onSectionChange(index);
    onClose();
  };

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          py: 3,
          px: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: (t) => t.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
          borderRight: (t) => `1px solid ${t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
        },
      }}
    >
      <Box>
        {/* User Profile Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 2, mb: 3 }}>
          <Avatar sx={{ width: 40, height: 40, background: (t) => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`, fontWeight: 700 }}>
            {user?.fullName?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700}>{user?.fullName || 'User'}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Dashboard</Typography>
          </Box>
        </Box>
        
        {/* Navigation Menu */}
        <List sx={{ px: 0 }}>
          {sections.map((sec, index) => (
            <ListItem disablePadding key={sec.label}>
              <ListItemButton
                selected={selectedIndex === index}
                onClick={() => handleSectionClick(index)}
                sx={{ borderRadius: 1.5, mb: 0.5, px: 1.5, py: 1.25, '&.Mui-selected': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', '& .MuiListItemIcon-root': { color: 'primary.main' } } }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{sec.icon}</ListItemIcon>
                <ListItemText primary={sec.label} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ px: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, mb: 1 }}>
          <ThemeToggle size="medium" />
        </Box>
        <Button fullWidth variant="text" color="error" onClick={onLogout} sx={{ borderRadius: 1.5, fontWeight: 600, py: 1.25 }}>Logout</Button>
      </Box>
    </Drawer>
  );
}
