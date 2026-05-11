import React from 'react';
import { Card, CardContent, Box, Typography, Avatar, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useDateFormat } from '../../hooks/useDateFormat';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import PersonIcon from '@mui/icons-material/Person';

export default function FeedbackCard({ feedback }) {
  const { formatDate } = useDateFormat();
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => {
      if (index < rating) {
        return <StarIcon key={index} sx={{ color: '#FFB800', fontSize: '1.2rem' }} />;
      }
      return <StarBorderIcon key={index} sx={{ color: 'text.disabled', fontSize: '1.2rem' }} />;
    });
  };

  return (
    <Card
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: 3,
        background: (t) => t.palette.background.paper,
        border: (t) => `1px solid ${t.palette.divider}`,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: (t) => `0 4px 12px ${alpha(t.palette.primary.main, 0.12)}`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="flex-start" gap={2}>
          {/* Avatar */}
          <Avatar
            sx={{
              bgcolor: feedback.is_anonymous 
                ? (t) => alpha(t.palette.text.secondary, 0.2)
                : 'primary.main',
              width: 48,
              height: 48,
            }}
          >
            {feedback.is_anonymous ? (
              <PersonIcon />
            ) : (
              (feedback.user?.fullName?.[0] || 'U').toUpperCase()
            )}
          </Avatar>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* User Name and Date */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} flexWrap="wrap" gap={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {feedback.is_anonymous ? 'Anonymous' : feedback.user?.fullName || 'Unknown User'}
                </Typography>
                {feedback.is_anonymous && (
                  <Chip
                    label="Anonymous"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      bgcolor: (t) => alpha(t.palette.text.secondary, 0.1),
                    }}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {formatDate(feedback.submitted_on)}
              </Typography>
            </Box>

            {/* Rating Stars */}
            <Box display="flex" alignItems="center" gap={0.5} mb={1.5}>
              {renderStars(feedback.rating)}
            </Box>

            {/* Comment */}
            {feedback.comment && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.6,
                  wordBreak: 'break-word',
                }}
              >
                {feedback.comment}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

