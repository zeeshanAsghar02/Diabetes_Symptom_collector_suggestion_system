import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
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
          Feedback
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Help us improve your Diavise experience and review your previous submissions.
        </Typography>
      </Box>

      <UserFeedbackHistory 
        userId={user?._id} 
        showForm={showFeedbackForm}
        onShowFormChange={setShowFeedbackForm}
        onFormClose={() => setShowFeedbackForm(false)}
      />
    </Paper>
  );
}
