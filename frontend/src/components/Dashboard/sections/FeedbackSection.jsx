import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import UserFeedbackHistory from '../../Feedback/UserFeedbackHistory';

export default function FeedbackSection({ showFeedbackForm, setShowFeedbackForm, user }) {
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        background: (t) => t.palette.background.paper,
        border: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
          My Feedback
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your feedback history and submit new feedback about your experience.
        </Typography>
      </Box>

      {!showFeedbackForm && (
        <Button
          variant="contained"
          size="large"
          onClick={() => setShowFeedbackForm(true)}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            px: 3,
            py: 1.5,
            mb: 3,
          }}
        >
          Submit New Feedback
        </Button>
      )}

      <UserFeedbackHistory 
        userId={user?._id} 
        showForm={showFeedbackForm}
        onFormClose={() => setShowFeedbackForm(false)}
      />
    </Paper>
  );
}
