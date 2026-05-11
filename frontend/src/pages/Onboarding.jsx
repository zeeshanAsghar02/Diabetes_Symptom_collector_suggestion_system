import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  alpha,
  Fade,
  Zoom,
  Stack,
  useMediaQuery,
  Tooltip,
  Slide,
  Skeleton,
} from '@mui/material';
import AuthBackground from '../components/Common/AuthBackground';
import { useTheme } from '../contexts/useThemeContext';
import {
  ArrowForward,
  ArrowBack,
  CheckCircle,
  Assessment,
  Timeline,
  HealthAndSafety,
  Psychology,
  TrendingUp,
  LocalHospital,
  FitnessCenter,
  Restaurant,
  EmojiEvents,
  Security,
  Speed,
  Close,
  Home,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';

/** Brand accents aligned with auth (cyan / sky / lime) */
const ACCENT = {
  welcome: '#22D3EE',
  features: '#38BDF8',
  benefits: '#A3E635',
};

/** Vertical pipeline: full-height rail in sidebar with inset from top/bottom */
const PIPE = {
  linePx: 4,
  /** Inset from the stretchable rail area (below “Your path”, above step footer) */
  railInsetTop: 8,
  railInsetBottom: 8,
};

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, isDarkMode } = useTheme();
  const { siteTitle } = useSettings();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [direction, setDirection] = useState('left');

  // Check if user is authenticated by checking localStorage
  const isAuthenticated = () => {
    return !!localStorage.getItem('accessToken');
  };

  // Determine the safe back navigation path
  const getBackNavigationPath = () => {
    // Check if user is authenticated
    if (isAuthenticated()) {
      return '/dashboard';
    }
    
    // Check the referrer from location state (can be location object or path string)
    const referrer = location.state?.from;
    const referrerPath = typeof referrer === 'string' ? referrer : referrer?.pathname;
    
    // Never go back to login or signup pages
    if (referrerPath && !referrerPath.includes('signin') && !referrerPath.includes('signup') && !referrerPath.includes('login')) {
      return referrerPath;
    }
    
    // Default to landing page for unauthenticated users
    return '/';
  };

  const handleBackNavigation = () => {
    const backPath = getBackNavigationPath();
    navigate(backPath);
  };

  useEffect(() => {
    // Simulate loading for smooth transitions
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const steps = useMemo(
    () => [
      {
        label: 'Welcome',
        title: 'Welcome to Your Health Journey',
        subtitle: 'Your AI-powered diabetes companion',
        description:
          'Guided symptom checks, tailored suggestions, and tools that fit how you live—so you stay in control, one step at a time.',
        icon: <HealthAndSafety sx={{ fontSize: { xs: 56, sm: 64, md: 72 } }} />,
        color: ACCENT.welcome,
        features: [
          { icon: <Assessment sx={{ fontSize: { xs: 28, sm: 32, md: 36 } }} />, text: 'Smart assessment', desc: 'Structured questions that adapt to your answers' },
          { icon: <Timeline sx={{ fontSize: { xs: 28, sm: 32, md: 36 } }} />, text: 'Clear progress', desc: 'See where you are in your check-in' },
          { icon: <Psychology sx={{ fontSize: { xs: 28, sm: 32, md: 36 } }} />, text: 'Actionable insight', desc: 'Suggestions you can use between visits' },
        ],
      },
      {
        label: 'Features',
        title: 'Everything in one calm place',
        subtitle: 'Built for daily diabetes care',
        description:
          'Meal ideas, movement prompts, and lifestyle tips sit alongside your assessments—no tab-hopping, no noise.',
        icon: <LocalHospital sx={{ fontSize: { xs: 56, sm: 64, md: 72 } }} />,
        color: ACCENT.features,
        features: [
          { icon: <Restaurant sx={{ fontSize: { xs: 28, sm: 32, md: 36 } }} />, text: 'Nutrition support', desc: 'Practical meal patterns, not rigid rules' },
          { icon: <FitnessCenter sx={{ fontSize: { xs: 28, sm: 32, md: 36 } }} />, text: 'Movement you can keep', desc: 'Short routines that respect your energy' },
          { icon: <TrendingUp sx={{ fontSize: { xs: 28, sm: 32, md: 36 } }} />, text: 'Habit nudges', desc: 'Small wins that stack over time' },
        ],
      },
      {
        label: 'Benefits',
        title: 'Designed for trust and speed',
        subtitle: 'Privacy-first, evidence-aware',
        description:
          'Your data stays yours. Clear flows mean less waiting—and answers you can share with your care team when you choose.',
        icon: <EmojiEvents sx={{ fontSize: { xs: 56, sm: 64, md: 72 } }} />,
        color: ACCENT.benefits,
        features: [
          { icon: <Security sx={{ fontSize: { xs: 28, sm: 32, md: 36 } }} />, text: 'Secure by default', desc: 'Encryption and careful access patterns' },
          { icon: <Speed sx={{ fontSize: { xs: 28, sm: 32, md: 36 } }} />, text: 'Fast to value', desc: 'Get oriented in minutes, not hours' },
          { icon: <CheckCircle sx={{ fontSize: { xs: 28, sm: 32, md: 36 } }} />, text: 'Grounded guidance', desc: 'Aligned with established diabetes education' },
        ],
      },
    ],
    []
  );

  const currentStep = steps[activeStep];
  const railProgress = steps.length > 1 ? activeStep / (steps.length - 1) : 1;

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // Navigate to diagnosis question instead of symptom assessment
      navigate('/diagnosis-question');
    } else {
      setDirection('left');
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setDirection('right');
    setActiveStep((prev) => prev - 1);
  };

  const handleSkip = () => {
    // Navigate to diagnosis question instead of symptom assessment
    navigate('/diagnosis-question');
  };

  const pageBg = isDarkMode
    ? 'linear-gradient(160deg, #0b1220 0%, #12182a 42%, #0a0f18 100%)'
    : 'linear-gradient(165deg, #ffffff 0%, #f8fafc 38%, #f0f9ff 100%)';

  const glass = {
    background: isDarkMode ? alpha(theme.palette.background.paper, 0.55) : alpha(theme.palette.background.paper, 0.78),
    backdropFilter: 'blur(20px) saturate(160%)',
    border: `1px solid ${alpha('#22D3EE', isDarkMode ? 0.14 : 0.12)}`,
    boxShadow: isDarkMode
      ? `0 24px 48px ${alpha('#000', 0.35)}`
      : `0 20px 40px ${alpha('#0f172a', 0.06)}`,
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        background: pageBg,
        display: 'flex',
        flexDirection: 'column',
        py: { xs: 2, sm: 2.5, md: 3 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <AuthBackground />

      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'flex-start',
          pt: { xs: 0, sm: 0.5 },
          pl: { xs: 2, sm: 3, md: 4 },
          pr: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Button
          onClick={() => navigate('/')}
          startIcon={<HealthAndSafety sx={{ color: '#22D3EE', fontSize: 22 }} />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            borderRadius: 999,
            px: 2.5,
            py: 0.85,
            color: isDarkMode ? '#f1f5f9' : '#0F172A',
            border: '1px solid rgba(34,211,238,0.38)',
            background: 'linear-gradient(135deg, rgba(34,211,238,0.14), rgba(163,230,53,0.16))',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(34,211,238,0.22), rgba(163,230,53,0.22))',
            },
          }}
        >
          {siteTitle || 'DiabetesCare'}
        </Button>
      </Box>

      <Container
        maxWidth="lg"
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          pt: { xs: 1, sm: 1.5 },
        }}
      >
        {/* Top actions — aligned with auth chrome */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'flex-end',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 1.25,
            mb: { xs: 2, md: 2.5 },
          }}
        >
          <Tooltip title={isAuthenticated() ? 'Back to Dashboard' : 'Back to Home'} arrow>
            <Button
              variant="outlined"
              onClick={handleBackNavigation}
              startIcon={isAuthenticated() ? <DashboardIcon sx={{ fontSize: 20 }} /> : <Home sx={{ fontSize: 20 }} />}
              fullWidth={isSmallScreen}
              sx={{
                textTransform: 'none',
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                fontWeight: 600,
                color: theme.palette.text.secondary,
                borderColor: alpha(theme.palette.divider, 0.35),
                borderRadius: 2,
                px: { xs: 2, sm: 2.5 },
                py: { xs: 0.85, sm: 1 },
                ...glass,
                '&:hover': {
                  borderColor: alpha('#22D3EE', 0.45),
                  color: theme.palette.text.primary,
                  bgcolor: alpha('#22D3EE', isDarkMode ? 0.08 : 0.06),
                },
                transition: 'color 0.2s ease, border-color 0.2s ease, background 0.2s ease',
              }}
            >
              {isAuthenticated() ? 'Dashboard' : 'Home'}
            </Button>
          </Tooltip>

          <Tooltip title="Skip to assessment" arrow disableInteractive>
            <span style={{ display: isSmallScreen ? 'block' : 'inline-block' }}>
              <Button
                variant="outlined"
                onClick={handleSkip}
                endIcon={<Close sx={{ fontSize: 18 }} />}
                fullWidth={isSmallScreen}
                sx={{
                  textTransform: 'none',
                  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                  fontWeight: 600,
                  color: '#0e7490',
                  borderColor: alpha('#22D3EE', 0.35),
                  borderRadius: 2,
                  px: { xs: 2, sm: 2.5 },
                  py: { xs: 0.85, sm: 1 },
                  ...glass,
                  ...(isDarkMode && {
                    color: '#67E8F9',
                    borderColor: alpha('#22D3EE', 0.28),
                  }),
                  '&:hover': {
                    borderColor: alpha('#22D3EE', 0.55),
                    bgcolor: alpha('#22D3EE', isDarkMode ? 0.12 : 0.08),
                  },
                  transition: 'border-color 0.2s ease, background 0.2s ease',
                }}
              >
                Skip intro
              </Button>
            </span>
          </Tooltip>
        </Box>

        {/* Main Content with Slide Animation */}
        <Slide 
          direction={direction === 'left' ? 'left' : 'right'} 
          in={true} 
          timeout={400} 
          key={activeStep}
          mountOnEnter
          unmountOnExit
        >
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Hero + vertical pipeline (rail before content) */}
            <Card
              elevation={0}
              sx={{
                mb: { xs: 2, sm: 2.5, md: 3 },
                borderRadius: { xs: 2, md: 2.25 },
                overflow: 'hidden',
                ...glass,
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, p: 2.5, width: '100%', alignItems: 'stretch' }}>
                  <Skeleton
                    variant="rectangular"
                    sx={{ width: { xs: 76, sm: 200 }, height: { xs: 220, sm: 200 }, borderRadius: 2, flexShrink: 0 }}
                  />
                  <Skeleton variant="rectangular" sx={{ flex: 1, minHeight: 220, borderRadius: 2 }} />
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    width: '100%',
                  }}
                >
                  <Box
                    component="nav"
                    aria-label="Intro steps"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      alignSelf: 'stretch',
                      flexShrink: 0,
                      width: { xs: 76, sm: 200, md: 228 },
                      py: { xs: 2, sm: 2.5 },
                      px: { xs: 1, sm: 2, md: 2.25 },
                      borderRight: `1px solid ${alpha('#22D3EE', 0.12)}`,
                      bgcolor: isDarkMode ? alpha('#020617', 0.35) : alpha('#f8fafc', 0.65),
                      minHeight: 0,
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        display: { xs: 'none', sm: 'block' },
                        letterSpacing: '0.14em',
                        color: 'text.secondary',
                        fontWeight: 700,
                        mb: 1.5,
                        flexShrink: 0,
                      }}
                    >
                      Your path
                    </Typography>
                    {/* Grows with card height so the rail can run much longer than the step stack alone */}
                    <Box
                      sx={{
                        position: 'relative',
                        flex: 1,
                        minHeight: { xs: 200, sm: 280 },
                        width: '100%',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: PIPE.railInsetTop,
                          bottom: PIPE.railInsetBottom,
                          left: { xs: '50%', sm: `${(42 - PIPE.linePx) / 2}px` },
                          width: PIPE.linePx,
                          borderRadius: PIPE.linePx / 2,
                          transform: { xs: 'translateX(-50%)', sm: 'none' },
                          bgcolor: alpha(theme.palette.text.primary, isDarkMode ? 0.12 : 0.08),
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: `${Math.max(0, Math.min(1, railProgress)) * 100}%`,
                            background: 'linear-gradient(180deg, #0EA5E9 0%, #22D3EE 45%, #84CC16 100%)',
                            borderRadius: PIPE.linePx / 2,
                            transition: 'height 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          position: 'relative',
                          zIndex: 1,
                          width: '100%',
                          height: '100%',
                          boxSizing: 'border-box',
                          pt: `${PIPE.railInsetTop}px`,
                          pb: `${PIPE.railInsetBottom}px`,
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: 0,
                        }}
                      >
                        {steps.map((step, index) => (
                          <Box
                            key={step.label}
                            sx={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'row',
                              flexWrap: 'nowrap',
                              alignItems: 'center',
                              justifyContent: { xs: 'center', sm: 'flex-start' },
                              gap: { xs: 0, sm: 1.25 },
                              width: '100%',
                              minHeight: 0,
                            }}
                          >
                            <Box
                              sx={{
                                width: { xs: 40, sm: 42 },
                                height: { xs: 40, sm: 42 },
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Tooltip title={`${step.label} — click to open`} arrow>
                                <Box
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      setDirection(index > activeStep ? 'left' : 'right');
                                      setActiveStep(index);
                                    }
                                  }}
                                  onClick={() => {
                                    setDirection(index > activeStep ? 'left' : 'right');
                                    setActiveStep(index);
                                  }}
                                  sx={{
                                    position: 'relative',
                                    zIndex: 1,
                                    width: { xs: 40, sm: 42 },
                                    height: { xs: 40, sm: 42 },
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    bgcolor:
                                      index === activeStep
                                        ? step.color
                                        : index < activeStep
                                          ? alpha(steps[index].color, 0.92)
                                          : alpha(theme.palette.text.primary, isDarkMode ? 0.14 : 0.1),
                                    color: index <= activeStep ? '#fff' : theme.palette.text.disabled,
                                    boxShadow:
                                      index === activeStep ? `0 0 0 4px ${alpha(step.color, 0.28)}` : 'none',
                                    transition: 'box-shadow 0.25s ease, transform 0.2s ease, background 0.2s ease',
                                    '&:hover': { transform: 'scale(1.05)' },
                                    '&:focus-visible': {
                                      outline: `2px solid ${alpha('#22D3EE', 0.8)}`,
                                      outlineOffset: 2,
                                    },
                                  }}
                                >
                                  {index < activeStep ? (
                                    <CheckCircle sx={{ fontSize: { xs: 20, sm: 22 } }} />
                                  ) : (
                                    <Typography variant="body2" fontWeight={800} sx={{ fontSize: { xs: '0.78rem', sm: '0.82rem' } }}>
                                      {index + 1}
                                    </Typography>
                                  )}
                                </Box>
                              </Tooltip>
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0, pt: 0.15, display: { xs: 'none', sm: 'block' } }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                                Phase {index + 1}
                              </Typography>
                              <Typography
                                variant="subtitle2"
                                fontWeight={index === activeStep ? 700 : 600}
                                color={index === activeStep ? 'text.primary' : 'text.secondary'}
                                sx={{ lineHeight: 1.35 }}
                              >
                                {step.label}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                      sx={{
                        mt: 'auto',
                        pt: 1.75,
                        textAlign: { xs: 'center', sm: 'left' },
                        letterSpacing: '0.02em',
                        width: '100%',
                        flexShrink: 0,
                      }}
                    >
                      {activeStep + 1}/{steps.length}
                    </Typography>
                  </Box>

                  <CardContent sx={{ flex: 1, minWidth: 0, p: { xs: 2.5, sm: 3.5, md: 4.5 } }}>
                <Stack spacing={{ xs: 3, md: 4 }} alignItems="center">
                  {/* Header Section */}
                  <Box sx={{ textAlign: 'center', width: '100%' }}>
                    {/* Animated Icon */}
                    <Zoom in={true} timeout={600}>
                      <Box
                        sx={{
                          p: { xs: 1.75, md: 2.25 },
                          borderRadius: 3,
                          background: `linear-gradient(145deg, ${alpha(currentStep.color, 0.18)}, ${alpha(currentStep.color, 0.04)})`,
                          color: currentStep.color,
                          display: 'inline-flex',
                          border: `1px solid ${alpha(currentStep.color, 0.35)}`,
                          transition: 'transform 0.35s ease, box-shadow 0.35s ease',
                          mb: { xs: 2, md: 2.25 },
                          boxShadow: `0 12px 32px ${alpha(currentStep.color, 0.12)}`,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 16px 40px ${alpha(currentStep.color, 0.2)}`,
                          },
                        }}
                      >
                        {currentStep.icon}
                      </Box>
                    </Zoom>

                    {/* Title and Description */}
                    <Box sx={{ maxWidth: { xs: '100%', sm: 600, md: 680 }, mx: 'auto', px: { xs: 0, sm: 2 } }}>
                      <Fade in={true} timeout={800}>
                        <Typography
                          variant="h3"
                          fontWeight={800}
                          sx={{
                            fontSize: { xs: '1.45rem', sm: '1.75rem', md: '2rem', lg: '2.2rem' },
                            color: 'text.primary',
                            letterSpacing: '-0.03em',
                            mb: { xs: 1.25, md: 1.75 },
                            lineHeight: 1.18,
                          }}
                        >
                          {currentStep.title}
                        </Typography>
                      </Fade>
                      <Fade in={true} timeout={1000}>
                        <Typography
                          variant="h6"
                          sx={{ 
                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                            fontWeight: 600,
                            mb: { xs: 1, md: 1.5 },
                            background: `linear-gradient(135deg, ${currentStep.color}, ${alpha(currentStep.color, 0.7)})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {currentStep.subtitle}
                        </Typography>
                      </Fade>
                      <Fade in={true} timeout={1200}>
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                            lineHeight: 1.7,
                            maxWidth: { xs: '100%', md: 560 },
                            mx: 'auto',
                          }}
                        >
                          {currentStep.description}
                        </Typography>
                      </Fade>
                    </Box>
                  </Box>

                  {/* Features Grid Layout - Integrated within Hero */}
                  <Box sx={{ width: '100%' }}>
                    <Grid 
                      container 
                      spacing={{ xs: 2, sm: 2.5, md: 3 }} 
                      sx={{ 
                        justifyContent: 'center',
                        alignItems: 'stretch',
                      }}
                    >
                      {currentStep.features.map((feature, index) => (
                        <Grid 
                          item 
                          xs={12} 
                          sm={6} 
                          md={4} 
                          key={index}
                          sx={{ display: 'flex' }}
                        >
                          <Zoom 
                            in={true} 
                            timeout={400 + index * 150} 
                            style={{ transitionDelay: `${index * 100}ms`, width: '100%', display: 'flex' }}
                          >
                            <Card
                              elevation={0}
                              sx={{
                                width: '100%',
                                minHeight: { xs: 'auto', sm: 200 },
                                display: 'flex',
                                flexDirection: 'column',
                                background: isDarkMode
                                  ? alpha(theme.palette.background.default, 0.35)
                                  : alpha('#fff', 0.55),
                                backdropFilter: 'blur(12px)',
                                border: `1px solid ${alpha(currentStep.color, isDarkMode ? 0.12 : 0.14)}`,
                                borderRadius: 2.25,
                                overflow: 'hidden',
                                transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  borderColor: alpha(currentStep.color, 0.35),
                                  boxShadow: `0 16px 36px ${alpha(currentStep.color, 0.12)}`,
                                  '& .feature-icon': {
                                    bgcolor: alpha(currentStep.color, 0.16),
                                  },
                                },
                              }}
                            >
                              <CardContent
                                sx={{
                                  p: { xs: 2.25, sm: 2.5 },
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'flex-start',
                                  '&:last-child': { pb: { xs: 2.25, sm: 2.5 } },
                                }}
                              >
                                <Stack spacing={1.75}>
                                  <Box
                                    className="feature-icon"
                                    sx={{
                                      width: 52,
                                      height: 52,
                                      borderRadius: 2,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      bgcolor: alpha(currentStep.color, 0.12),
                                      color: currentStep.color,
                                      transition: 'background 0.25s ease',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {feature.icon}
                                  </Box>
                                  <Box>
                                    <Typography
                                      variant="subtitle1"
                                      fontWeight={700}
                                      sx={{
                                        fontSize: '1rem',
                                        mb: 0.5,
                                        color: 'text.primary',
                                        lineHeight: 1.35,
                                      }}
                                    >
                                      {feature.text}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, fontSize: '0.875rem' }}>
                                      {feature.desc}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </CardContent>
                            </Card>
                          </Zoom>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Stack>
                  </CardContent>
                </Box>
              )}
            </Card>

            {/* Responsive Navigation Buttons */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column-reverse', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: 'stretch',
                mt: { xs: 2.5, md: 3 },
                gap: { xs: 1.75, sm: 2 },
              }}
            >
              {/* Back Button */}
              <Fade in={activeStep > 0} timeout={300}>
                <Box sx={{ flex: { xs: 1, sm: 0 } }}>
                  <Button
                    size={isMobile ? 'large' : 'medium'}
                    onClick={handleBack}
                    disabled={activeStep === 0}
                    startIcon={<ArrowBack />}
                    fullWidth={isMobile}
                    sx={{
                      minWidth: { xs: '100%', sm: 120 },
                      px: { xs: 3, sm: 3, md: 3.5 },
                      py: { xs: 1.5, sm: 1.25, md: 1.5 },
                      borderRadius: 2.25,
                      textTransform: 'none',
                      fontSize: { xs: '1rem', sm: '0.9375rem' },
                      fontWeight: 600,
                      visibility: activeStep === 0 ? 'hidden' : 'visible',
                      color: 'text.secondary',
                      border: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
                      backdropFilter: 'blur(12px)',
                      background: isDarkMode ? alpha(theme.palette.background.paper, 0.45) : alpha(theme.palette.background.paper, 0.85),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.text.primary, 0.06),
                        color: 'text.primary',
                        borderColor: alpha('#22D3EE', 0.35),
                      },
                      '&:disabled': {
                        opacity: 0,
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Back
                  </Button>
                </Box>
              </Fade>

              {/* Next/Get Started Button */}
              <Box sx={{ flex: { xs: 1, sm: 0 } }}>
                <Button
                  variant="contained"
                  size={isMobile ? 'large' : 'medium'}
                  onClick={handleNext}
                  endIcon={activeStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
                  fullWidth={isMobile}
                  sx={{
                    minWidth: { xs: '100%', sm: 180 },
                    py: { xs: 1.75, sm: 1.5, md: 1.75 },
                    px: { xs: 4, sm: 4, md: 5 },
                    fontSize: { xs: '1rem', sm: '0.9375rem', md: '1rem' },
                    fontWeight: 700,
                    borderRadius: 2.25,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 42%, #65A30D 108%)',
                    color: '#fff',
                    boxShadow: `0 10px 28px ${alpha('#22D3EE', 0.35)}`,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 45%, #84CC16 100%)',
                      boxShadow: `0 14px 36px ${alpha('#22D3EE', 0.42)}`,
                      transform: 'translateY(-2px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
                  }}
                >
                  {activeStep === steps.length - 1 ? 'Get Started' : 'Continue'}
                </Button>
              </Box>
            </Box>

          </Box>
        </Slide>
      </Container>
    </Box>
  );
};

export default Onboarding;
