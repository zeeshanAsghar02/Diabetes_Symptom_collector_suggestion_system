import React from 'react';
import { Paper, Box, Typography, Grid, LinearProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import StarIcon from '@mui/icons-material/Star';
import RateReviewIcon from '@mui/icons-material/RateReview';

export default function FeedbackStats({ stats }) {
  if (!stats) return null;

  const getRatingPercentage = (count) => {
    if (!stats.totalFeedback || stats.totalFeedback === 0) return 0;
    return (count / stats.totalFeedback) * 100;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 4,
        background: (t) => t.palette.background.paper,
        border: (t) => `1px solid ${t.palette.divider}`,
        boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
        mb: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
      }}
    >
      <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: 0.2 }}>
        Feedback Statistics
      </Typography>

      {/* KPI Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: 1.5,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            background: (t) => t.palette.background.default,
            border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.15)}`,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.25}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: (t) => alpha(t.palette.primary.main, 0.12),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RateReviewIcon sx={{ color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight={700}>
                Total Feedback
              </Typography>
              <Typography variant="h5" fontWeight={900} color="primary.main">
                {stats.totalFeedback || 0}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            background: (t) => t.palette.background.default,
            border: (t) => `1px solid ${alpha(t.palette.success.main, 0.15)}`,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.25}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: (t) => alpha('#FFB800', 0.18),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StarIcon sx={{ color: '#FFB800' }} />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight={700}>
                Average Rating
              </Typography>
              <Typography variant="h5" fontWeight={900} sx={{ color: '#FFB800' }}>
                {stats.averageRating ? parseFloat(stats.averageRating).toFixed(1) : '0.0'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Rating Distribution */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          background: (t) => t.palette.background.default,
          border: (t) => `1px solid ${alpha(t.palette.divider, 0.9)}`,
        }}
      >
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5, letterSpacing: 0.1 }}>
          Rating Distribution
        </Typography>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingCounts?.[rating] || 0;
          const percentage = getRatingPercentage(count);
          return (
            <Box key={rating} sx={{ mb: 1.5 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.35}>
                <Typography variant="body2" fontWeight={700}>
                  {rating} Star{rating !== 1 ? 's' : ''}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  {count} ({percentage.toFixed(1)}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    bgcolor: rating >= 4 ? 'success.main' : rating >= 3 ? 'warning.main' : 'error.main',
                  },
                }}
              />
            </Box>
          );
        })}
      </Paper>

      {/* Category Averages */}
      {stats.categoryAverages && Object.keys(stats.categoryAverages).length > 0 && (
        <Box>
          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.2, letterSpacing: 0.1 }}>
            Category Averages
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(auto-fit, minmax(320px, 1fr))',
              },
              gap: 1.5,
            }}
          >
            {Object.entries(stats.categoryAverages).map(([cat, val]) => (
              <Paper
                key={cat}
                elevation={0}
                sx={{
                  p: 1.75,
                  borderRadius: 3,
                  border: (t) => `1px solid ${alpha(t.palette.divider, 0.9)}`,
                  background: (t) => t.palette.background.default,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Typography variant="body2" fontWeight={700} sx={{ mr: 1, flex: 1, minWidth: 0 }}>
                  {cat}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <StarIcon sx={{ color: '#FFB800', fontSize: 18 }} />
                  <Typography variant="body2" fontWeight={800}>
                    {val.toFixed ? val.toFixed(2) : Number(val).toFixed(2)}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
}

