import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Paper, Stack } from '@mui/material';
import { 
  AutoAwesome as AIIcon,
  FitnessCenter as FitnessCenterIcon,
  Psychology as BrainIcon 
} from '@mui/icons-material';

const AIGenerationLoader = ({ message = 'Generating your personalized content...' }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Analyzing your profile...', icon: <BrainIcon />, color: '#667eea' },
    { label: 'Consulting health guidelines...', icon: <AIIcon />, color: '#764ba2' },
    { label: 'Creating personalized recommendations...', icon: <FitnessCenterIcon />, color: '#f093fb' },
    { label: 'Finalizing your plan...', icon: <AIIcon />, color: '#4facfe' }
  ];

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((oldProgress) => {
        const newProgress = oldProgress + 1;
        if (newProgress >= 100) {
          return 100;
        }
        return newProgress;
      });
    }, 300); // Complete in ~30 seconds

    const stepTimer = setInterval(() => {
      setCurrentStep((oldStep) => {
        const newStep = (oldStep + 1) % steps.length;
        return newStep;
      });
    }, 7000); // Change step every 7 seconds

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #eef2ff 100%)',
        p: 3
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 600,
          width: '100%',
          p: 5,
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated background gradient */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #4facfe)',
            backgroundSize: '200% 100%',
            animation: 'gradientMove 3s linear infinite',
            '@keyframes gradientMove': {
              '0%': { backgroundPosition: '0% 50%' },
              '100%': { backgroundPosition: '200% 50%' }
            }
          }}
        />

        <Stack spacing={4} alignItems="center">
          {/* AI Icon Animation */}
          <Box
            sx={{
              position: 'relative',
              width: 120,
              height: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Rotating circles */}
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '3px solid',
                borderColor: 'transparent',
                borderTopColor: '#667eea',
                animation: 'spin 2s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                width: '80%',
                height: '80%',
                borderRadius: '50%',
                border: '3px solid',
                borderColor: 'transparent',
                borderBottomColor: '#764ba2',
                animation: 'spin 3s linear infinite reverse',
              }}
            />
            
            {/* Center icon with pulse */}
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' }
                }
              }}
            >
              <AIIcon sx={{ fontSize: 32, color: '#ffffff' }} />
            </Box>
          </Box>

          {/* Message */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h5" 
              fontWeight={700} 
              sx={{ 
                mb: 1,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              AI is Working...
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
              {message}
            </Typography>
          </Box>

          {/* Progress Bar */}
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: '#64748b' }}>
                Progress
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#667eea' }}>
                {Math.min(progress, 100)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(progress, 100)} 
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: '#f1f5f9',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  borderRadius: 4
                }
              }}
            />
          </Box>

          {/* Current Step */}
          <Box 
            sx={{ 
              width: '100%',
              p: 3,
              borderRadius: 3,
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${steps[currentStep].color} 0%, ${steps[currentStep].color}dd 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  animation: 'fadeIn 0.5s ease-in',
                  '@keyframes fadeIn': {
                    '0%': { opacity: 0, transform: 'scale(0.8)' },
                    '100%': { opacity: 1, transform: 'scale(1)' }
                  }
                }}
              >
                {steps[currentStep].icon}
              </Box>
              <Typography 
                variant="body1" 
                fontWeight={600} 
                sx={{ 
                  color: '#1e293b',
                  animation: 'slideIn 0.5s ease-out',
                  '@keyframes slideIn': {
                    '0%': { opacity: 0, transform: 'translateX(-10px)' },
                    '100%': { opacity: 1, transform: 'translateX(0)' }
                  }
                }}
              >
                {steps[currentStep].label}
              </Typography>
            </Stack>
          </Box>

          {/* Fun tip */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              💡 This usually takes 15-30 seconds. Your plan will be ready soon!
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default AIGenerationLoader;
