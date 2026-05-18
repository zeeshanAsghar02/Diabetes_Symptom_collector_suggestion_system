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
        justifyContent: 'center',
        py: 0,
      }}
    >
      <AuthBackground />
      <Container
        maxWidth="md"
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          px: { xs: 1, sm: 2 },
          py: 0,
          minHeight: 0,
        }}
      >
        {/* Header Actions */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 14, sm: 18 },
            left: { xs: 16, sm: 24 },
            zIndex: 2,
          }}
        >
          <Tooltip title="Back" arrow disableInteractive>
            <Button
              variant="outlined"
              onClick={handleBack}
              sx={{
                minWidth: 44,
                minHeight: 44,
                p: 0,
                borderRadius: '50%',
                color: theme.palette.text.primary,
                borderColor: alpha(theme.palette.divider, 0.2),
                background: alpha(theme.palette.background.paper, 0.85),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  borderColor: theme.palette.primary.main,
                },
                transition: 'all 0.25s ease',
              }}
            >
              <ArrowBack sx={{ fontSize: 20 }} />
            </Button>
          </Tooltip>
        </Box>

        {/* Main Content */}
        <Fade in={!isLoading} timeout={600}>
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: 760,
              maxHeight: 'calc(100vh - 28px)',
              minHeight: { xs: 360, sm: 400, md: 440 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: { xs: 1.5, sm: 2, md: 2.5 },
              pt: { xs: 5, sm: 6 },
              background: alpha(theme.palette.background.paper, isDarkMode ? 0.72 : 0.96),
              backdropFilter: 'blur(20px) saturate(160%)',
              borderRadius: { xs: 2, md: 2.5 },
              border: `1px solid ${alpha('#22D3EE', isDarkMode ? 0.12 : 0.16)}`,
              boxShadow: isDarkMode
                ? `0 24px 60px ${alpha('#000', 0.24)}`
                : `0 20px 40px ${alpha('#0f172a', 0.08)}`,
            }}
          >
            {/* Icon */}
            <Zoom in={!isLoading} timeout={800}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: { xs: 72, md: 100 },
                    height: { xs: 72, md: 100 },
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
                  fontSize: { xs: '1.15rem', sm: '1.3rem', md: '1.55rem' },
                  fontWeight: 800,
                  textAlign: 'center',
                  mb: 1.5,
                  letterSpacing: '-0.025em',
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
                  fontSize: { xs: '0.82rem', sm: '0.88rem', md: '0.92rem' },
                  maxWidth: 620,
                  mx: 'auto',
                  mb: 2.5,
                  lineHeight: 1.55,
                }}
              >
                One calm question so we can show the right next steps. You can change your mind later—this only guides what you see in the app.
              </Typography>
            </Fade>

            {/* Answer Options */}
            <Stack spacing={1.25} sx={{ mb: 1.25, flex: 1, justifyContent: 'center' }}>
              <Zoom in={!isLoading} timeout={1400}>
                <Card
                  elevation={0}
                  onClick={() => handleAnswer('yes')}
                  sx={{
                    cursor: 'pointer',
                    border: `1px solid ${
                      selectedAnswer === 'yes'
                        ? theme.palette.primary.main
                        : alpha(theme.palette.divider, 0.16)
                    }`,
                    background:
                      selectedAnswer === 'yes'
                        ? alpha(theme.palette.primary.main, 0.08)
                        : alpha(theme.palette.background.paper, 0.85),
                    borderRadius: 3,
                    transition: 'all 0.25s ease',
                    minHeight: { xs: 96, md: 112 },
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                      background: alpha(theme.palette.primary.main, 0.08),
                      boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.12)}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, md: 2 }, display: 'flex', alignItems: 'center', gap: 1.75 }}>
                    <Box
                      sx={{
                        width: { xs: 40, md: 48 },
                        height: { xs: 40, md: 48 },
                        borderRadius: '50%',
                        background:
                          selectedAnswer === 'yes'
                            ? 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 100%)'
                            : alpha(theme.palette.primary.main, 0.12),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {selectedAnswer === 'yes' ? (
                        <CheckCircle sx={{ fontSize: { xs: 20, md: 24 }, color: 'white' }} />
                      ) : (
                        <AssignmentTurnedIn
                          sx={{
                            fontSize: { xs: 20, md: 24 },
                            color: theme.palette.primary.main,
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: { xs: '0.95rem', md: '1.05rem' },
                          fontWeight: 700,
                          mb: 0.4,
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
                        sx={{ fontSize: { xs: '0.82rem', md: '0.88rem' }, lineHeight: 1.55 }}
                      >
                        Access personalized diabetes management tools and insights
                      </Typography>
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
                    border: `1px solid ${
                      selectedAnswer === 'no'
                        ? theme.palette.primary.main
                        : alpha(theme.palette.divider, 0.16)
                    }`,
                    background:
                      selectedAnswer === 'no'
                        ? alpha(theme.palette.primary.main, 0.08)
                        : alpha(theme.palette.background.paper, 0.85),
                    borderRadius: 3,
                    transition: 'all 0.25s ease',
                    minHeight: { xs: 96, md: 112 },
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                      background: alpha(theme.palette.primary.main, 0.08),
                      boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.12)}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, md: 2 }, display: 'flex', alignItems: 'center', gap: 1.75 }}>
                    <Box
                      sx={{
                        width: { xs: 40, md: 48 },
                        height: { xs: 40, md: 48 },
                        borderRadius: '50%',
                        background:
                          selectedAnswer === 'no'
                            ? 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 100%)'
                            : alpha(theme.palette.primary.main, 0.12),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {selectedAnswer === 'no' ? (
                        <CheckCircle sx={{ fontSize: { xs: 20, md: 24 }, color: 'white' }} />
                      ) : (
                        <PersonalVideo
                          sx={{
                            fontSize: { xs: 20, md: 24 },
                            color: theme.palette.primary.main,
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: { xs: '0.95rem', md: '1.05rem' },
                          fontWeight: 700,
                          mb: 0.4,
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
                        sx={{ fontSize: { xs: '0.82rem', md: '0.88rem' }, lineHeight: 1.55 }}
                      >
                        Take our symptom assessment to evaluate your risk level
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            </Stack>

            {/* Continue Button */}
            <Fade in={!isLoading} timeout={1800}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5, pb: { xs: 1, sm: 0 } }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleContinue}
                  disabled={!selectedAnswer}
                  endIcon={<ArrowForward />}
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    maxWidth: 320,
                    py: { xs: 1.4, sm: 1.35 },
                    px: { xs: 3.5, sm: 4 },
                    fontSize: { xs: '0.9rem', sm: '0.95rem' },
                    fontWeight: 700,
                    borderRadius: 3,
                    textTransform: 'none',
                    background: selectedAnswer
                      ? 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 95%)'
                      : alpha(theme.palette.action.disabled, 0.18),
                    color: selectedAnswer ? '#fff' : theme.palette.action.disabled,
                    boxShadow: selectedAnswer ? `0 12px 28px ${alpha('#22D3EE', 0.24)}` : 'none',
                    '&:hover': {
                      background: selectedAnswer
                        ? 'linear-gradient(135deg, #0284C7 0%, #06B6D4 95%)'
                        : alpha(theme.palette.action.disabled, 0.18),
                      boxShadow: selectedAnswer ? `0 14px 34px ${alpha('#22D3EE', 0.28)}` : 'none',
                    },
                    '&:disabled': {
                      opacity: 0.7,
                    },
                    transition: 'all 0.25s ease',
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
