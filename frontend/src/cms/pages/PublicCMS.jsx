import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  Home as HomeIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import ContentViewer from '../components/ContentViewer';
import ArticleDetail from '../components/ArticleDetail';
import { useParams } from 'react-router-dom';

const PublicCMS = () => {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // If we have a slug, show the article detail
  if (slug) {
    return <ArticleDetail />;
  }

  const tabs = [
    {
      label: 'Articles',
      icon: <ArticleIcon />,
      component: <ContentViewer />
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
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

      <Box sx={{ p: 2 }}>
        {tabs[activeTab].component}
      </Box>
    </Box>
  );
};

export default PublicCMS;
