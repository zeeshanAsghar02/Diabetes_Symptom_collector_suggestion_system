import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Category as CategoryIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import CMSDashboard from './CMSDashboard';
import CategoryList from '../components/CategoryList';
import ContentList from '../components/ContentList';

const CMSManagement = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    {
      label: 'Dashboard',
      icon: <DashboardIcon />,
      component: <CMSDashboard />
    },
    {
      label: 'Categories',
      icon: <CategoryIcon />,
      component: <CategoryList />
    },
    {
      label: 'Content',
      icon: <ArticleIcon />,
      component: <ContentList />
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Modern Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontWeight: 700,
            mb: 3,
            background: (theme) => 
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #ffffff 0%, #b0b0b0 100%)'
                : 'linear-gradient(135deg, #0f172a 0%, #475569 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Content Management System
        </Typography>
        
        {/* Modern Tabs */}
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: (theme) => 
              theme.palette.mode === 'dark' 
                ? 'rgba(30, 30, 30, 0.8)' 
                : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: (theme) => 
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, #90caf9, #42a5f5)'
                    : 'linear-gradient(90deg, #2563eb, #1e40af)',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: 64,
                padding: '12px 24px',
                color: 'text.secondary',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: (theme) => 
                    theme.palette.mode === 'dark'
                      ? 'rgba(144, 202, 249, 0.08)'
                      : 'rgba(37, 99, 235, 0.08)',
                },
                '&.Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 700,
                },
                '& .MuiSvgIcon-root': {
                  marginRight: 1,
                  fontSize: '1.25rem',
                },
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Paper>
      </Box>

      <Box sx={{ p: 0 }}>
        {tabs[activeTab].component}
      </Box>
    </Box>
  );
};

export default CMSManagement;
