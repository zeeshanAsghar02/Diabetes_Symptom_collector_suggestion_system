import React from 'react';
import { Box, Typography } from '@mui/material';
import UserFeedbackHistory from '../../Feedback/UserFeedbackHistory';

export default function FeedbackSection({ showFeedbackForm, setShowFeedbackForm, user }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: { xs: 2.25, md: 4.5 },
        color: '#f8fafc',
        fontFamily: '"Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: `
          radial-gradient(circle at 15% 8%, rgba(45, 212, 191, 0.13), transparent 30%),
          radial-gradient(circle at 78% 12%, rgba(34, 211, 238, 0.12), transparent 32%),
          radial-gradient(circle at 70% 84%, rgba(167, 139, 250, 0.1), transparent 34%),
          linear-gradient(135deg, #050816 0%, #07101c 52%, #050b13 100%)
        `,
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.024) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.024) 1px, transparent 1px)
          `,
          backgroundSize: '54px 54px',
          maskImage: 'radial-gradient(circle at 54% 30%, black, transparent 78%)',
        },
      }}
    >
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" fontWeight={560} sx={{ color: '#fff', letterSpacing: '-0.055em', mb: 0.75 }}>
          Feedback
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.64)', maxWidth: 650, lineHeight: 1.7 }}>
          Help us improve your Diavise experience and review your previous submissions.
        </Typography>
      </Box>

      <UserFeedbackHistory
        userId={user?._id}
        showForm={showFeedbackForm}
        onShowFormChange={setShowFeedbackForm}
        onFormClose={() => setShowFeedbackForm(false)}
      />
    </Box>
  );
}
