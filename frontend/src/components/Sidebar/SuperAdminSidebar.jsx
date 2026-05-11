import React from 'react';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  Divider,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  BugReport as SymptomsIcon,
  Lightbulb as SuggestionsIcon,
  People as UsersIcon,
  Article as ContentIcon,
  RestaurantMenu as PlansIcon,
  Chat as ChatIcon,
  Assessment as ReportsIcon,
  History as AuditIcon,
  Settings as SettingsIcon,
  Feedback as FeedbackIcon,
  ChevronLeft,
  ChevronRight,
  Logout as LogoutIcon
} from '@mui/icons-material';
import ThemeToggle from '../Common/ThemeToggle';
import sidebarTokens from '../../theme/sidebar-tokens.json';
import { useSettings } from '../../context/SettingsContext';

const SuperAdminSidebar = ({
  open = true,
  onToggle,
  onClose,
  selectedIndex,
  onSectionChange,
  sections = [],
  user,
  onLogout,
  variant = 'permanent', // 'permanent', 'temporary'
  isMobile = false
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const tokens = isDark ? sidebarTokens.colors.dark : sidebarTokens.colors.light;
  const { siteTitle } = useSettings();

  // Menu items configuration
  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, key: 'dashboard' },
    { label: 'Manage Diseases', icon: <DashboardIcon />, key: 'diseases' },
    { label: 'Manage Symptoms', icon: <SymptomsIcon />, key: 'symptoms' },
    { label: 'Manage Questions', icon: <SuggestionsIcon />, key: 'questions' },
    { label: 'User Management', icon: <UsersIcon />, key: 'users' },
    { label: 'Content Management', icon: <ContentIcon />, key: 'content' },
    { label: 'Feedback (Admin)', icon: <FeedbackIcon />, key: 'feedback' },
    { label: 'Audit Logs', icon: <AuditIcon />, key: 'audit' },
    { label: 'Document Upload', icon: <PlansIcon />, key: 'documents' },
    { label: 'Manage Admins', icon: <UsersIcon />, key: 'admins' },
    { label: 'Manage Roles & Permissions', icon: <SettingsIcon />, key: 'roles' },
    { label: 'Settings', icon: <SettingsIcon />, key: 'settings' }
  ];

  const handleItemClick = (index) => {
    onSectionChange(index);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const drawerWidth = open ? sidebarTokens.width.expanded : sidebarTokens.width.collapsed;
  const mobileWidth = sidebarTokens.width.mobile;

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: tokens.background,
        transition: `all ${sidebarTokens.transition.duration} ${sidebarTokens.transition.easing}`,
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          p: open ? '12px 16px' : '12px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          minHeight: '56px',
          transition: `padding ${sidebarTokens.transition.duration} ${sidebarTokens.transition.easing}`,
        }}
      >
        {open && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '14px'
              }}
            >
              D
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: tokens.text.primary,
                fontWeight: 700,
                fontSize: '15px',
                letterSpacing: '-0.5px'
              }}
            >
              {siteTitle}
            </Typography>
          </Box>
        )}
        {!isMobile && (
          <IconButton
            onClick={onToggle}
            size="small"
            sx={{
              bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              '&:hover': {
                bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              },
              transition: 'all 0.2s',
            }}
          >
            {open ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: tokens.divider }} />

      {/* User Profile Section */}
      <Box
        sx={{
          p: open ? '12px 16px' : '12px 8px',
          display: 'flex',
          flexDirection: open ? 'row' : 'column',
          alignItems: 'center',
          gap: open ? 1 : 0.75,
          bgcolor: tokens.userSection.background,
          borderBottom: `1px solid ${tokens.userSection.border}`,
          transition: `all ${sidebarTokens.transition.duration} ${sidebarTokens.transition.easing}`,
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
            fontWeight: 700,
            fontSize: '14px',
            color: 'white'
          }}
        >
          {user?.fullName?.[0]?.toUpperCase() || 'A'}
        </Avatar>
        {open && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                color: tokens.text.primary,
                fontWeight: 600,
                fontSize: '13px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                mb: 0.25,
                lineHeight: 1.3
              }}
            >
              {user?.fullName || 'Admin User'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: tokens.text.secondary,
                fontWeight: 500,
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                lineHeight: 1.2
              }}
            >
              Super Admin
            </Typography>
          </Box>
        )}
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 2 }}>
        <List
          sx={{
            px: open ? 1.5 : 0.5,
            '& .MuiListItem-root': {
              mb: sidebarTokens.spacing.gap.menuItems,
            }
          }}
        >
          {sections.map((section, index) => {
            const isActive = selectedIndex === index;
            const Icon = menuItems[index]?.icon || <DashboardIcon />;
            
            const itemContent = (
              <ListItemButton
                selected={isActive}
                onClick={() => handleItemClick(index)}
                sx={{
                  borderRadius: sidebarTokens.borderRadius.menuItem,
                  py: `${sidebarTokens.spacing.itemPadding.vertical}`,
                  px: open ? `${sidebarTokens.spacing.itemPadding.horizontal}` : `${sidebarTokens.spacing.itemPadding.horizontalCollapsed}`,
                  minHeight: '44px',
                  justifyContent: open ? 'flex-start' : 'center',
                  bgcolor: isActive ? tokens.menuItem.active.background : tokens.menuItem.default.background,
                  color: isActive ? tokens.menuItem.active.text : tokens.menuItem.default.text,
                  transition: `all ${sidebarTokens.transition.duration} ${sidebarTokens.transition.easing}`,
                  '&:hover': {
                    bgcolor: isActive ? tokens.menuItem.active.background : tokens.menuItem.hover.background,
                    color: isActive ? tokens.menuItem.active.text : tokens.menuItem.hover.text,
                    '& .MuiListItemIcon-root': {
                      color: isActive ? tokens.menuItem.active.icon : tokens.menuItem.hover.icon,
                    }
                  },
                  '& .MuiListItemIcon-root': {
                    color: isActive ? tokens.menuItem.active.icon : tokens.menuItem.default.icon,
                    minWidth: open ? '36px' : 'auto',
                    transition: `all ${sidebarTokens.transition.duration} ${sidebarTokens.transition.easing}`,
                  },
                  '& .MuiListItemText-primary': {
                    fontSize: sidebarTokens.fontSize.menuItem,
                    fontWeight: isActive ? sidebarTokens.fontWeight.menuItemActive : sidebarTokens.fontWeight.menuItem,
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    fontSize: sidebarTokens.iconSize.menu,
                    '& svg': {
                      fontSize: sidebarTokens.iconSize.menu
                    }
                  }}
                >
                  {Icon}
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={section.label}
                    sx={{
                      opacity: open ? 1 : 0,
                      transition: `opacity ${sidebarTokens.transition.duration} ${sidebarTokens.transition.easing}`,
                    }}
                  />
                )}
              </ListItemButton>
            );

            return (
              <ListItem key={section.label} disablePadding>
                {!open ? (
                  <Tooltip title={section.label} placement="right" arrow>
                    {itemContent}
                  </Tooltip>
                ) : (
                  itemContent
                )}
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ borderColor: tokens.divider }} />

      {/* Footer Section */}
      <Box
        sx={{
          p: open ? 2 : 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          alignItems: open ? 'stretch' : 'center'
        }}
      >
        {/* Theme Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <ThemeToggle size="small" />
        </Box>

        {/* Logout Button */}
        {open ? (
          <IconButton
            onClick={onLogout}
            sx={{
              borderRadius: sidebarTokens.borderRadius.menuItem,
              py: 1.25,
              color: '#ef4444',
              bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
              '&:hover': {
                bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
              },
              transition: 'all 0.2s',
              display: 'flex',
              gap: 1
            }}
          >
            <LogoutIcon fontSize="small" />
            <Typography variant="body2" fontWeight={600}>
              Logout
            </Typography>
          </IconButton>
        ) : (
          <Tooltip title="Logout" placement="right" arrow>
            <IconButton
              onClick={onLogout}
              sx={{
                color: '#ef4444',
                bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                },
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={variant === 'temporary' ? open : true}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
      sx={{
        width: isMobile ? mobileWidth : drawerWidth,
        flexShrink: 0,
        display: isMobile ? { xs: 'block', md: 'none' } : { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          width: isMobile ? mobileWidth : drawerWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${tokens.border}`,
          transition: `width ${sidebarTokens.transition.duration} ${sidebarTokens.transition.easing}`,
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default SuperAdminSidebar;
