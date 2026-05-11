import React from 'react';
import { Card, CardContent, CardActions, Box, Typography, Button, Chip, LinearProgress } from '@mui/material';
import dashboardTheme from '../../../theme/dashboardTheme';
import { toast } from 'react-toastify';

/**
 * Reusable Feature Card Component for Dashboard
 * Handles locked/unlocked states, completion progress, and coming soon states
 */
const FeatureCard = ({
  title,
  description,
  icon: Icon,
  iconGradient,
  buttonGradient,
  isLocked = false,
  isComingSoon = false,
  completionPercentage = null,
  onClick,
  personalInfoCompletion = 0,
}) => {
  const handleClick = () => {
    if (isLocked && personalInfoCompletion < 100) {
      toast.info('Complete your Personal & Medical Information to unlock this section.');
      return;
    }
    if (onClick && !isComingSoon) {
      onClick();
    }
  };

  const isDisabled = (isLocked && personalInfoCompletion < 100) || isComingSoon;
  const currentOpacity = isDisabled ? 0.6 : 1;
  const currentCursor = isComingSoon ? 'default' : isDisabled ? 'not-allowed' : 'pointer';
  const currentIconBg = isDisabled ? '#e5e7eb' : iconGradient;
  const currentIconColor = isDisabled ? '#9ca3af' : '#fff';

  return (
    <Card
      elevation={0}
      sx={{
        background: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #e5e7eb',
        cursor: currentCursor,
        transition: 'all 0.3s ease',
        opacity: currentOpacity,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 4,
        position: 'relative',
        '&:hover': !isDisabled ? {
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          transform: 'translateY(-4px)',
        } : {},
      }}
      onClick={handleClick}
    >
      {/* Status Chip */}
      {isComingSoon && (
        <Chip 
          label="⏳ Coming Soon" 
          size="small" 
          sx={{ 
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#fff',
            fontWeight: 700,
            zIndex: 10,
          }} 
        />
      )}
      {isLocked && personalInfoCompletion < 100 && !isComingSoon && (
        <Chip 
          label="🔒 Locked" 
          size="small" 
          sx={{ 
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            fontWeight: 700,
            zIndex: 10,
          }} 
        />
      )}

      {/* Icon */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: currentIconBg,
          mb: 3,
          mx: 'auto',
        }}
      >
        <Icon sx={{ fontSize: 40, color: currentIconColor }} />
      </Box>

      {/* Content */}
      <CardContent sx={{ flexGrow: 1, p: 0, '&:last-child': { pb: 0 } }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700, 
            mb: 1.5, 
            color: '#1f2937', 
            textAlign: 'center', 
            fontSize: '1.25rem' 
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#6b7280', 
            lineHeight: 1.7, 
            textAlign: 'center' 
          }}
        >
          {description}
        </Typography>

        {/* Completion Progress (for Personal & Medical Info card) */}
        {completionPercentage !== null && completionPercentage > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: dashboardTheme.colors.neutral[600], 
                  fontWeight: 600 
                }}
              >
                Completion
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: dashboardTheme.colors.primary.main, 
                  fontWeight: 700 
                }}
              >
                {completionPercentage}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={completionPercentage} 
              sx={{ 
                height: 6, 
                borderRadius: '8px', 
                bgcolor: dashboardTheme.colors.neutral[200],
                '& .MuiLinearProgress-bar': { 
                  background: dashboardTheme.colors.primary.gradient,
                  borderRadius: '8px',
                } 
              }} 
            />
          </Box>
        )}
      </CardContent>

      {/* Action Button */}
      <CardActions sx={{ p: 0, pt: 3 }}>
        <Button 
          fullWidth 
          variant="contained"
          disabled={isDisabled}
          sx={{
            ...dashboardTheme.buttonStyles.primary,
            background: isDisabled 
              ? dashboardTheme.colors.neutral[400] 
              : buttonGradient,
            py: 1.5,
          }}
        >
          {isComingSoon ? 'Coming Soon' : 'Continue'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default FeatureCard;
