import React from 'react';
import { Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Assignment, Article } from '@mui/icons-material';

const QuickActions = () => {
  const navigate = useNavigate();
  return (
    <Box display="flex" flexWrap="wrap" gap={1.5}>
      <Button
        variant="contained"
        startIcon={<Assignment />}
        onClick={() => navigate('/onboarding')}
        sx={{ 
          borderRadius: 2, 
          fontWeight: 700,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 2,
          }
        }}
      >
        Complete Details
      </Button>
      <Button
        variant="outlined"
        startIcon={<Assignment />}
        onClick={() => navigate('/assessment')}
        sx={{ 
          borderRadius: 2, 
          fontWeight: 700,
          textTransform: 'none',
        }}
      >
        View Assessment
      </Button>
      <Button
        variant="text"
        startIcon={<Article />}
        onClick={() => navigate('/content')}
        sx={{ 
          borderRadius: 2, 
          fontWeight: 700,
          textTransform: 'none',
        }}
      >
        Learn & Articles
      </Button>
    </Box>
  );
};

export default QuickActions;
