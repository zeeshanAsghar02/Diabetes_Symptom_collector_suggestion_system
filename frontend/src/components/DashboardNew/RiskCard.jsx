import React from 'react';
import { Paper, Box, Typography, Button, Grid, alpha } from '@mui/material';
import { TrendingUp, Assessment } from '@mui/icons-material';

const RiskCard = ({ onAssess, lastAssessedAt }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 3,
        // Clean, professional solid background with subtle accent
        background: (t) => t.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.15)} 0%, ${alpha(t.palette.primary.dark, 0.05)} 100%)`
          : `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.08)} 0%, ${alpha(t.palette.primary.light, 0.04)} 100%)`,
        border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.2)}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: (t) => t.palette.primary.main,
          boxShadow: (t) => `0 8px 20px ${alpha(t.palette.primary.main, 0.15)}`,
        },
      }}
    >
      <Box>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
              <Box sx={{ 
                width: 44, 
                height: 44, 
                borderRadius: 2, 
                background: (t) => alpha(t.palette.primary.main, 0.12), 
                border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.25)}`,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Assessment sx={{ fontSize: 24, color: 'primary.main' }} />
              </Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                Risk Assessment
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7, fontWeight: 500 }}>
              Get your personalized diabetes risk score with AI-powered insights and actionable health recommendations.
            </Typography>
            {lastAssessedAt && (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Last assessed: {new Date(lastAssessedAt).toLocaleString()}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={onAssess}
              endIcon={<TrendingUp />}
              sx={{ 
                borderRadius: 2, 
                py: 1.5, 
                fontWeight: 700, 
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: (t) => `0 4px 12px ${alpha(t.palette.primary.main, 0.25)}`,
                }
              }}
            >
              Start Assessment
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default RiskCard;
