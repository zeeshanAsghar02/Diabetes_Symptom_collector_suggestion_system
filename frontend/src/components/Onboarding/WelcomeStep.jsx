import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

// Simple welcome step introducing the assessment flow
// Props: onNext() to advance to next step
const WelcomeStep = ({ onNext }) => {
  return (
    <Box sx={{ p: { xs: 3, md: 6 }, textAlign: 'center' }}>
      <Typography variant="h3" fontWeight={700} gutterBottom>
        Welcome 👋
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        We'll guide you through a short set of symptom-based questions to personalize your assessment.
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        You can stop at any time and return later. If you sign in first, your progress will be saved automatically.
      </Typography>
      <Button
        variant="contained"
        size="large"
        endIcon={<ArrowForward />}
        onClick={onNext}
        sx={{
          borderRadius: 3,
          px: 5,
          py: 1.8,
          fontWeight: 600,
          textTransform: 'none'
        }}
      >
        Get Started
      </Button>
    </Box>
  );
};

export default WelcomeStep;
