import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  alpha,
  Fade,
  Zoom,
  Stack,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  ArrowForward,
  ArrowBack,
  CheckCircle,
  Close,
  HealthAndSafety,
  AssignmentTurnedIn,
  PersonalVideo,
  Home,
} from '@mui/icons-material';
import { useOnboarding } from '../contexts/OnboardingContext';
import AuthBackground from '../components/Common/AuthBackground';
import { useTheme } from '../contexts/useThemeContext';

const DiagnosisQuestion = () => {
  const navigate = useNavigate();
  const { theme, isDarkMode } = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { updateDiagnosisStatus, onboardingState, setCurrentStep } = useOnboarding();

  useEffect(() => {
    // Set current step to diagnosis only once on mount
    setCurrentStep('diagnosis');
    
    // Simulate loading for smooth transitions
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // If already answered, pre-select
  useEffect(() => {
    if (onboardingState.isDiagnosed) {
      setSelectedAnswer(onboardingState.isDiagnosed);
    }
  }, [onboardingState.isDiagnosed]);

  const handleBack = () => {
    navigate('/onboarding');
  };

  const handleSkip = () => {
    // Navigate to symptom assessment for unauthenticated users
    navigate('/symptom-assessment');
  };

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleContinue = () => {
    if (!selectedAnswer) return;

    // Update diagnosis status in context
    updateDiagnosisStatus(selectedAnswer);

    if (selectedAnswer === 'yes') {
      // If diagnosed, show login/signup prompt to access diagnosed dashboard
      navigate('/signin', { 
        state: { 
          isDiagnosed: true,
          message: 'Please sign in to access your personalized diabetes management dashboard'
        } 
      });
    } else {
      // If not diagnosed, continue to symptom assessment
      navigate('/symptom-assessment');
    }
  };

  const pageBg = isDarkMode
    ? 'linear-gradient(160deg, #0b1220 0%, #12182a 42%, #0a0f18 100%)'
    : 'linear-gradient(165deg, #ffffff 0%, #f8fafc 38%, #f0f9ff 100%)';

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        background: pageBg,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 3, md: 5 },
      }}
    >
      <AuthBackground />
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header Actions */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: { xs: 3, md: 4 },
            gap: 2,
            flexWrap: isSmallScreen ? 'wrap' : 'nowrap',
          }}
        >
          <Tooltip title="Back to Tour" arrow disableInteractive>
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<Home sx={{ fontSize: { xs: 16, sm: 18 } }} />}
              sx={{
                textTransform: 'none',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                fontWeight: 600,
                color: theme.palette.text.primary,
                borderColor: alpha(theme.palette.divider, 0.2),
                px: { xs: 2, sm: 3 },
                py: { xs: 0.75, sm: 1 },
                borderRadius: 2,
                backdropFilter: 'blur(10px)',
                background: alpha(theme.palette.background.paper, 0.8),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  transform: 'translateX(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Back</Box>
            </Button>
          </Tooltip>

          <Tooltip title="Skip to Assessment" arrow disableInteractive>
            <Button
              variant="outlined"
              onClick={handleSkip}
              endIcon={<Close sx={{ fontSize: { xs: 16, sm: 18 } }} />}
              sx={{
                textTransform: 'none',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                fontWeight: 600,
                color: theme.palette.primary.main,
                borderColor: alpha(theme.palette.primary.main, 0.3),
                px: { xs: 2, sm: 3 },
                py: { xs: 0.75, sm: 1 },
                borderRadius: 2,
                backdropFilter: 'blur(10px)',
                background: alpha(theme.palette.background.paper, 0.8),
                '&:hover': {
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  borderColor: theme.palette.primary.main,
                  transform: 'scale(1.02)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Skip
            </Button>
          </Tooltip>
        </Box>

        {/* Main Content */}
        <Fade in={!isLoading} timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
              background: alpha(theme.palette.background.paper, isDarkMode ? 0.55 : 0.82),
              backdropFilter: 'blur(20px) saturate(160%)',
              borderRadius: { xs: 2, md: 2.25 },
              border: `1px solid ${alpha('#22D3EE', isDarkMode ? 0.14 : 0.12)}`,
              boxShadow: isDarkMode
                ? `0 24px 48px ${alpha('#000', 0.35)}`
                : `0 20px 40px ${alpha('#0f172a', 0.06)}`,
            }}
          >
            {/* Icon */}
            <Zoom in={!isLoading} timeout={800}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    width: { xs: 80, md: 100 },
                    height: { xs: 80, md: 100 },
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                >
                  <HealthAndSafety sx={{ fontSize: { xs: 40, md: 50 }, color: 'white' }} />
                </Box>
              </Box>
            </Zoom>

            {/* Title */}
            <Fade in={!isLoading} timeout={1000}>
              <Typography
                variant="h3"
                sx={{
                  fontSize: { xs: '1.6rem', sm: '1.85rem', md: '2.1rem' },
                  fontWeight: 800,
                  textAlign: 'center',
                  mb: 2,
                  letterSpacing: '-0.03em',
                  color: 'text.primary',
                }}
              >
                Have you been diagnosed with diabetes?
              </Typography>
            </Fade>

            {/* Subtitle */}
            <Fade in={!isLoading} timeout={1200}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  textAlign: 'center',
                  fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                  maxWidth: 600,
                  mx: 'auto',
                  mb: 5,
                  lineHeight: 1.7,
                }}
              >
                One calm question so we can show the right next steps. You can change your mind later—this only guides what you see in the app.
              </Typography>
            </Fade>

            {/* Answer Options */}
            <Stack spacing={3} sx={{ mb: 4 }}>
              <Zoom in={!isLoading} timeout={1400}>
                <Card
                  elevation={0}
                  onClick={() => handleAnswer('yes')}
                  sx={{
                    cursor: 'pointer',
                    border: `2px solid ${
                      selectedAnswer === 'yes'
                        ? theme.palette.primary.main
                        : alpha(theme.palette.divider, 0.2)
                    }`,
                    background:
                      selectedAnswer === 'yes'
                        ? alpha(theme.palette.primary.main, 0.08)
                        : alpha(theme.palette.background.paper, 0.6),
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: alpha('#22D3EE', 0.55),
                      background: alpha('#22D3EE', isDarkMode ? 0.08 : 0.05),
                      boxShadow: `0 6px 20px ${alpha('#22D3EE', 0.12)}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: { xs: 48, md: 56 },
                          height: { xs: 48, md: 56 },
                          borderRadius: '50%',
                          background:
                            selectedAnswer === 'yes'
                              ? 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 50%, #65A30D 100%)'
                              : alpha('#22D3EE', 0.12),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {selectedAnswer === 'yes' ? (
                          <CheckCircle sx={{ fontSize: { xs: 24, md: 28 }, color: 'white' }} />
                        ) : (
                          <AssignmentTurnedIn
                            sx={{
                              fontSize: { xs: 24, md: 28 },
                              color: theme.palette.primary.main,
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontSize: { xs: '1rem', md: '1.2rem' },
                            fontWeight: 700,
                            mb: 0.5,
                            color:
                              selectedAnswer === 'yes'
                                ? theme.palette.primary.main
                                : theme.palette.text.primary,
                          }}
                        >
                          Yes, I have been diagnosed with diabetes
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.85rem', md: '0.9rem' } }}
                        >
                          Access personalized diabetes management tools and insights
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>

              <Zoom in={!isLoading} timeout={1600}>
                <Card
                  elevation={0}
                  onClick={() => handleAnswer('no')}
                  sx={{
                    cursor: 'pointer',
                    border: `2px solid ${
                      selectedAnswer === 'no'
                        ? theme.palette.primary.main
                        : alpha(theme.palette.divider, 0.2)
                    }`,
                    background:
                      selectedAnswer === 'no'
                        ? alpha(theme.palette.primary.main, 0.08)
                        : alpha(theme.palette.background.paper, 0.6),
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: alpha('#22D3EE', 0.55),
                      background: alpha('#22D3EE', isDarkMode ? 0.08 : 0.05),
                      boxShadow: `0 6px 20px ${alpha('#22D3EE', 0.12)}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: { xs: 48, md: 56 },
                          height: { xs: 48, md: 56 },
                          borderRadius: '50%',
                          background:
                            selectedAnswer === 'no'
                              ? 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 50%, #65A30D 100%)'
                              : alpha('#22D3EE', 0.12),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {selectedAnswer === 'no' ? (
                          <CheckCircle sx={{ fontSize: { xs: 24, md: 28 }, color: 'white' }} />
                        ) : (
                          <PersonalVideo
                            sx={{
                              fontSize: { xs: 24, md: 28 },
                              color: theme.palette.primary.main,
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontSize: { xs: '1rem', md: '1.2rem' },
                            fontWeight: 700,
                            mb: 0.5,
                            color:
                              selectedAnswer === 'no'
                                ? theme.palette.primary.main
                                : theme.palette.text.primary,
                          }}
                        >
                          No, I am not diagnosed with diabetes
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.85rem', md: '0.9rem' } }}
                        >
                          Take our symptom assessment to evaluate your risk level
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            </Stack>

            {/* Continue Button */}
            <Fade in={!isLoading} timeout={1800}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleContinue}
                  disabled={!selectedAnswer}
                  endIcon={<ArrowForward />}
                  sx={{
                    minWidth: { xs: '100%', sm: 200 },
                    py: { xs: 1.75, sm: 1.5 },
                    px: { xs: 4, sm: 5 },
                    fontSize: { xs: '1rem', sm: '1.05rem' },
                    fontWeight: 700,
                    borderRadius: 2.5,
                    textTransform: 'none',
                    background: selectedAnswer
                      ? 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 42%, #65A30D 108%)'
                      : alpha(theme.palette.action.disabled, 0.12),
                    color: selectedAnswer ? '#fff' : theme.palette.action.disabled,
                    boxShadow: selectedAnswer ? `0 10px 28px ${alpha('#22D3EE', 0.35)}` : 'none',
                    '&:hover': {
                      background: selectedAnswer
                        ? 'linear-gradient(135deg, #0284C7 0%, #06B6D4 45%, #84CC16 100%)'
                        : alpha(theme.palette.action.disabled, 0.12),
                      boxShadow: selectedAnswer ? `0 14px 36px ${alpha('#22D3EE', 0.42)}` : 'none',
                    },
                    '&:disabled': {
                      opacity: 0.6,
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  Continue
                </Button>
              </Box>
            </Fade>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default DiagnosisQuestion;
