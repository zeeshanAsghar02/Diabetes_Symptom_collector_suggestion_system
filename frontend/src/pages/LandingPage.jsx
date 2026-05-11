import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Chip,
  Paper,
  IconButton,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
  Link,
  alpha,
  Collapse,
  Skeleton,
  Fade,
  Slide,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  Security,
  Speed,
  Support,
  ArrowForward,
  CheckCircle,
  Star,
  PlayArrow,
  GitHub,
  LinkedIn,
  Twitter,
  Email,
  Phone,
  LocationOn,
  Analytics,
  Psychology,
  LocalHospital,
  ExpandMore,
  ExpandLess,
  Favorite,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import LandingAboutCareSection from '../components/Common/LandingAboutCareSection';
import LandingHowItWorksPipeline from '../components/Common/LandingHowItWorksPipeline';
import LandingKnowledgeCtaSection from '../components/Common/LandingKnowledgeCtaSection';
import BlogSection from '../components/Common/BlogSection';
import ArticleModal from '../components/Common/ArticleModal';
import TestimonialsSection from '../components/Common/TestimonialsSection';
import { useSettings } from '../context/SettingsContext';

const MotionDiv = motion.div;

function footerLinkSx(theme, tc) {
  return {
    fontSize: '0.9375rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
    transition: 'color 0.2s ease',
    '&:hover': {
      color: tc.cyan || theme.palette.info.main,
    },
  };
}

function FooterContactRow(props) {
  const { icon: IconGlyph, children } = props;
  const theme = useTheme();
  const tc = theme.palette.brandTelecare || {};
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(tc.cyan || theme.palette.info.main, 0.1),
          color: tc.cyan || theme.palette.info.main,
        }}
      >
        <IconGlyph sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ pt: 0.35, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const displayFont =
    theme.typography.marketingHeadline?.fontFamily || theme.typography.fontFamily;
  const tc = theme.palette.brandTelecare || {};
  const [articleModal, setArticleModal] = useState({ open: false, article: null });
  const { siteTitle, contactEmail, contactPhone, siteDescription } = useSettings();
  const heroBrandWords = (siteTitle || 'Diabetes TeleCare').trim().split(/\s+/).filter(Boolean);
  const [footerExpanded, setFooterExpanded] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => setIsAuthenticated(!!localStorage.getItem('accessToken'));
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/') return;
    const h = location.hash;
    if (!h) return;
    const t = window.setTimeout(() => {
      document.querySelector(h)?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.hash]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
      },
    },
  };

  const features = [
    {
      icon: <Analytics sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'AI-Powered Assessment',
      description: 'Advanced machine learning algorithms analyze your symptoms and provide accurate diabetes risk assessment with confidence scoring.',
    },
    {
      icon: <Psychology sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      title: 'Personalized Recommendations',
      description: 'Get tailored health recommendations based on your specific symptoms and risk factors.',
    },
    {
      icon: <LocalHospital sx={{ fontSize: 40, color: theme.palette.success.main }} />,
      title: 'Comprehensive Symptom Tracking',
      description: 'Track and monitor diabetes-related symptoms with detailed questionnaires and progress tracking.',
    },
    {
      icon: <Security sx={{ fontSize: 40, color: theme.palette.warning.main }} />,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and stored securely with full privacy protection.',
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: theme.palette.info.main }} />,
      title: 'Instant Results',
      description: 'Get your assessment results immediately with detailed explanations and next steps.',
    },
    {
      icon: <Support sx={{ fontSize: 40, color: theme.palette.error.main }} />,
      title: '24/7 Support',
      description: 'Access comprehensive health resources and support whenever you need it.',
    },
  ];

  const handleArticleClick = (article) => {
    setArticleModal({ open: true, article });
  };

  const handleCloseArticleModal = () => {
    setArticleModal({ open: false, article: null });
  };

  const handleFooterToggle = (section) => {
    setFooterExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.background.gradient || theme.palette.background.default,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Hero — full-width split: copy | visual (option 1, minimal) */}
      <Box
        id="home"
        component="section"
        sx={{
          width: '100%',
          pt: { xs: 2, md: 3 },
          pb: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <MotionDiv initial="hidden" animate="visible" variants={containerVariants}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'stretch',
              width: '100%',
              minHeight: { xs: 'auto', md: 'min(88vh, 800px)' },
            }}
          >
            {/* Copy column */}
            <Box
              sx={{
                flex: { xs: '1 1 auto', md: '1 1 50%' },
                maxWidth: { md: '50%' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: theme.palette.mode === 'light' ? '#FAFAF8' : theme.palette.background.default,
                borderRight: { md: `1px solid ${theme.palette.divider}` },
                py: { xs: 5, sm: 6, md: 8 },
                px: { xs: 3, sm: 4, md: 5, lg: 6 },
              }}
            >
              <MotionDiv variants={itemVariants} style={{ width: '100%' }}>
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 640,
                    mx: 'auto',
                    textAlign: 'center',
                  }}
                >
                  {isLoading ? (
                    <>
                      <Skeleton variant="text" width="90%" height={56} sx={{ mb: 1, mx: 'auto' }} />
                      <Skeleton variant="text" width="75%" height={56} sx={{ mb: 2, mx: 'auto' }} />
                      <Skeleton variant="text" width="100%" height={88} sx={{ mb: 3, mx: 'auto' }} />
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <Skeleton variant="rounded" width={200} height={48} sx={{ borderRadius: 2 }} />
                        <Skeleton variant="rounded" width={160} height={48} sx={{ borderRadius: 2 }} />
                      </Stack>
                    </>
                  ) : (
                    <>
                      <Typography
                        component="h1"
                        sx={{
                          fontFamily: displayFont,
                          fontWeight: 800,
                          color: 'text.primary',
                          fontSize: { xs: '2.35rem', sm: '2.85rem', md: '3.35rem', lg: '3.65rem' },
                          lineHeight: 1.1,
                          letterSpacing: '-0.03em',
                          mb: { xs: 2.25, md: 2.75 },
                        }}
                      >
                        Clear answers for your{' '}
                        <Box
                          component="span"
                          sx={{
                            color: tc.lime || theme.palette.success.main,
                            display: { xs: 'inline', sm: 'inline' },
                          }}
                        >
                          diabetes journey
                        </Box>
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: theme.typography.fontFamily,
                          fontWeight: 400,
                          color: 'text.secondary',
                          fontSize: { xs: '1.125rem', sm: '1.1875rem', md: '1.25rem' },
                          lineHeight: 1.65,
                          mb: { xs: 3, md: 3.5 },
                          maxWidth: 580,
                          mx: 'auto',
                        }}
                      >
                        Log symptoms, complete your assessment, and unlock personalized diet, exercise, and lifestyle
                        guidance—so every step matches how you actually live with diabetes.
                      </Typography>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent="center"
                        sx={{ width: '100%' }}
                      >
                        <Button
                          variant="contained"
                          size="large"
                          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/onboarding')}
                          startIcon={<ArrowForward />}
                          fullWidth={isSmallScreen}
                          sx={{
                            fontFamily: theme.typography.fontFamily,
                            py: 1.4,
                            px: 3,
                            fontSize: { xs: '0.9375rem', md: '1rem' },
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2,
                            color: tc.onGradient || '#fff',
                            background:
                              tc.navPillGradient ||
                              `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            boxShadow: 'none',
                            '&:hover': {
                              boxShadow: `0 8px 24px ${alpha(tc.cyan || theme.palette.primary.main, 0.28)}`,
                            },
                          }}
                        >
                          {isAuthenticated ? 'Go to Dashboard' : 'Start assessment'}
                        </Button>
                        <Button
                          variant="outlined"
                          size="large"
                          startIcon={<PlayArrow />}
                          fullWidth={isSmallScreen}
                          sx={{
                            fontFamily: theme.typography.fontFamily,
                            py: 1.4,
                            px: 3,
                            fontSize: { xs: '0.9375rem', md: '1rem' },
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2,
                            borderWidth: 1.5,
                            borderColor: alpha(tc.cyan || theme.palette.info.main, 0.55),
                            color: tc.cyan || theme.palette.info.main,
                            '&:hover': {
                              borderWidth: 1.5,
                              bgcolor: alpha(tc.cyan || theme.palette.info.main, 0.06),
                            },
                          }}
                        >
                          Watch demo
                        </Button>
                      </Stack>
                    </>
                  )}
                </Box>
              </MotionDiv>
            </Box>

            {/* Visual column — heart + Diabetes Care wordmark (no photo) */}
            <Box
              sx={{
                flex: { xs: '1 1 auto', md: '1 1 50%' },
                maxWidth: { md: '50%' },
                minHeight: { xs: 280, sm: 340, md: 'min(88vh, 800px)' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: { xs: 3, md: 4 },
                py: { xs: 4, md: 6 },
                background:
                  theme.palette.mode === 'light'
                    ? `linear-gradient(160deg, ${alpha(tc.cyan || theme.palette.info.main, 0.08)} 0%, ${alpha(tc.lime || theme.palette.success.main, 0.12)} 55%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
                    : `linear-gradient(160deg, ${alpha(tc.cyan || theme.palette.info.main, 0.12)} 0%, ${alpha(tc.lime || theme.palette.success.main, 0.08)} 50%, ${theme.palette.background.paper} 100%)`,
              }}
            >
              <Stack alignItems="center" spacing={{ xs: 3, md: 3.5 }} sx={{ textAlign: 'center', maxWidth: 440 }}>
                <Box
                  sx={{
                    width: { xs: 140, sm: 152, md: 176 },
                    height: { xs: 140, sm: 152, md: 176 },
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${tc.cyan || theme.palette.info.main} 0%, ${tc.lime || theme.palette.success.main} 100%)`,
                    boxShadow: `0 20px 48px ${alpha(tc.cyan || theme.palette.primary.main, 0.3)}`,
                  }}
                >
                  <Favorite
                    sx={{
                      fontSize: { xs: 72, sm: 80, md: 96 },
                      color: tc.onGradient || '#FFFFFF',
                    }}
                  />
                </Box>
                <Typography
                  component="p"
                  sx={{
                    fontFamily: displayFont,
                    fontWeight: 800,
                    fontSize: { xs: '2.125rem', sm: '2.5rem', md: '2.875rem' },
                    lineHeight: 1.12,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {heroBrandWords.length >= 2 ? (
                    <>
                      <Box component="span" sx={{ color: tc.cyan || theme.palette.info.main }}>
                        {heroBrandWords.slice(0, -1).join(' ')}{' '}
                      </Box>
                      <Box component="span" sx={{ color: tc.lime || theme.palette.success.main }}>
                        {heroBrandWords[heroBrandWords.length - 1]}
                      </Box>
                    </>
                  ) : (
                    <Box component="span" sx={{ color: tc.cyan || theme.palette.info.main }}>
                      {heroBrandWords[0] || 'Diabetes Care'}
                    </Box>
                  )}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontFamily: theme.typography.fontFamily,
                    fontSize: { xs: '1.0625rem', sm: '1.125rem', md: '1.1875rem' },
                    lineHeight: 1.55,
                    maxWidth: 340,
                  }}
                >
                  Your one-stop hub for assessment, plans, and support.
                </Typography>
              </Stack>
            </Box>
          </Box>
        </MotionDiv>
      </Box>

      <LandingAboutCareSection siteTitle={siteTitle || 'Diabetes TeleCare'} />

      <LandingHowItWorksPipeline siteTitle={siteTitle} />

      {/* Responsive Features Section */}
      <Box
        sx={{
          py: { xs: 6, md: 8 },
          bgcolor: theme.palette.mode === 'light' ? '#FAFAF8' : theme.palette.background.default,
        }}
      >
        <Container maxWidth="lg">
          <MotionDiv
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <Box textAlign="center" mb={{ xs: 4, md: 6 }}>
              <MotionDiv variants={itemVariants}>
                <Typography 
                  variant="h3" 
                  fontWeight={700} 
                  color="text.primary" 
                  gutterBottom
                  sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' } }}
                >
                  Comprehensive Features
                </Typography>
                <Typography 
                  variant="h6" 
                  color="text.secondary" 
                  maxWidth="md" 
                  mx="auto"
                  sx={{ 
                    fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem' },
                    px: { xs: 2, sm: 0 },
                  }}
                >
                  Everything you need for accurate diabetes risk assessment and health management
                </Typography>
              </MotionDiv>
            </Box>
            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent="center">
              {features.map((feature, index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={index} sx={{ display: 'flex' }}>
                  <MotionDiv variants={itemVariants} style={{ width: '100%' }}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        background: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: { xs: 2, md: 3 },
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: theme.shadows[12],
                          border: `1px solid ${theme.palette.primary.main}40`,
                        },
                      }}
                    >
                      <CardContent
                        sx={{
                          p: { xs: 3, md: 4 },
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          flexGrow: 1,
                        }}
                      >
                        <MotionDiv
                          whileHover={{ rotate: 360, scale: 1.15 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Box
                            sx={{
                              mb: { xs: 2, md: 3 },
                              p: { xs: 1.5, md: 2 },
                              borderRadius: '50%',
                              background: alpha(feature.icon.props.sx.color, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: { xs: 64, md: 72 },
                              height: { xs: 64, md: 72 },
                            }}
                          >
                            {React.cloneElement(feature.icon, { 
                              sx: { 
                                fontSize: { xs: 32, md: 40 }, 
                                color: feature.icon.props.sx.color 
                              } 
                            })}
                          </Box>
                        </MotionDiv>
                        <Typography 
                          variant="h6" 
                          fontWeight={600} 
                          gutterBottom 
                          sx={{ 
                            mb: 2,
                            fontSize: { xs: '1.05rem', md: '1.25rem' },
                          }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            lineHeight: 1.6,
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: { xs: '0.875rem', md: '0.95rem' },
                          }}
                        >
                          {feature.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </MotionDiv>
                </Grid>
              ))}
            </Grid>
          </MotionDiv>
        </Container>
      </Box>

      <LandingKnowledgeCtaSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Blogs & Articles Section */}
      <BlogSection
        title="Health & Wellness Articles"
        subtitle="Discover expert insights, tips, and latest research on diabetes management and healthy living"
        showFilters={false}
        limit={3}
        featuredFirst={true}
        onArticleClick={handleArticleClick}
      />

      {/* Pre-footer CTA — 80% width, centered; flat card + neutral shadow (matches testimonials / features) */}
      <Box
        sx={{
          py: { xs: 6, md: 8 },
          px: { xs: 2, sm: 3 },
          display: 'flex',
          justifyContent: 'center',
          bgcolor: theme.palette.mode === 'light' ? '#E0F2FE' : theme.palette.background.default,
        }}
      >
        <Box
          sx={{
            width: { xs: '100%', sm: '90%', md: '80%' },
            maxWidth: 900,
            mx: 'auto',
          }}
        >
          <MotionDiv
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3.5, sm: 5, md: 6 },
                textAlign: 'center',
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
                boxShadow:
                  theme.palette.mode === 'light'
                    ? `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}, 0 12px 32px ${alpha(theme.palette.common.black, 0.06)}`
                    : `0 1px 2px ${alpha(theme.palette.common.black, 0.2)}, 0 12px 32px ${alpha(theme.palette.common.black, 0.28)}`,
              }}
            >
              <MotionDiv variants={itemVariants}>
                <Typography
                  component="h2"
                  sx={{
                    fontFamily: displayFont,
                    fontWeight: 800,
                    color: 'text.primary',
                    fontSize: { xs: '1.5rem', sm: '1.85rem', md: '2.25rem' },
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                    mb: 1.5,
                  }}
                >
                  Ready to take control of{' '}
                  <Box component="span" sx={{ color: tc.lime || theme.palette.success.main }}>
                    your health
                  </Box>
                  ?
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: '0.9375rem', sm: '1.05rem', md: '1.1rem' },
                    lineHeight: 1.65,
                    maxWidth: 560,
                    mx: 'auto',
                    mb: { xs: 3, md: 3.5 },
                    px: { xs: 0, sm: 1 },
                  }}
                >
                  Join thousands of users who have already discovered their diabetes risk and received personalized
                  recommendations.
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent="center"
                  alignItems="center"
                  sx={{ width: '100%' }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate(isAuthenticated ? '/dashboard' : '/onboarding')}
                    fullWidth={isSmallScreen}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      py: { xs: 1.5, md: 1.65 },
                      px: { xs: 3, md: 4 },
                      fontSize: { xs: '0.95rem', md: '1.05rem' },
                      borderRadius: 2,
                      color: tc.onGradient || '#FFFFFF',
                      background:
                        tc.navPillGradient ||
                        `linear-gradient(90deg, ${tc.navPillBlue || theme.palette.primary.main} 0%, ${tc.cyan || theme.palette.info.main} 100%)`,
                      boxShadow: 'none',
                      '&:hover': {
                        background:
                          tc.navPillGradient ||
                          `linear-gradient(90deg, ${tc.navPillBlue || theme.palette.primary.main} 0%, ${tc.cyan || theme.palette.info.main} 100%)`,
                        filter: 'brightness(1.04)',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {isAuthenticated ? 'Go to Dashboard' : 'Start your assessment'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth={isSmallScreen}
                    onClick={() => {
                      if (location.pathname === '/') {
                        document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        navigate({ pathname: '/', hash: 'about' });
                      }
                    }}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      py: { xs: 1.5, md: 1.65 },
                      px: { xs: 3, md: 4 },
                      fontSize: { xs: '0.95rem', md: '1.05rem' },
                      borderRadius: 2,
                      borderWidth: 2,
                      borderColor: tc.cyan || theme.palette.info.main,
                      color: tc.cyan || theme.palette.info.main,
                      '&:hover': {
                        borderWidth: 2,
                        borderColor: tc.cyan || theme.palette.info.main,
                        bgcolor: alpha(tc.cyan || theme.palette.info.main, 0.08),
                      },
                    }}
                  >
                    Learn more
                  </Button>
                </Stack>
              </MotionDiv>
            </Paper>
          </MotionDiv>
        </Box>
      </Box>

      {/* Footer — TeleCare marketing UI (gradient accent, brand mark, spaced columns) */}
      <Box
        id="contact"
        component="footer"
        sx={{
          position: 'relative',
          scrollMarginTop: { xs: '96px', md: '112px' },
        }}
      >
        <Box
          aria-hidden
          sx={{
            height: 4,
            background:
              tc.topBarGradient ||
              `linear-gradient(90deg, ${tc.cyan || theme.palette.info.main} 0%, ${tc.lime || theme.palette.success.main} 100%)`,
          }}
        />
        <Box
          sx={{
            py: { xs: 5, md: 7 },
            px: 0,
            background:
              theme.palette.mode === 'light'
                ? `linear-gradient(180deg, ${alpha(tc.cyan || theme.palette.info.main, 0.06)} 0%, ${alpha('#FAFAF8', 0.97)} 28%, ${theme.palette.background.paper} 100%)`
                : `linear-gradient(180deg, ${alpha(tc.cyan || theme.palette.info.main, 0.08)} 0%, ${theme.palette.background.paper} 45%, ${theme.palette.background.default} 100%)`,
            borderTop: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'light' ? 1 : 0.8)}`,
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={{ xs: 4, md: 5 }} columns={{ xs: 12, md: 12 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2.5 }}>
                  <Box
                    sx={{
                      width: { xs: 48, sm: 52 },
                      height: { xs: 48, sm: 52 },
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${tc.cyan || theme.palette.info.main} 0%, ${tc.lime || theme.palette.success.main} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: tc.onGradient || '#FFFFFF',
                      fontWeight: 800,
                      fontSize: { xs: '1.15rem', sm: '1.2rem' },
                      boxShadow: `0 4px 16px ${alpha(tc.cyan || theme.palette.primary.main, 0.28)}`,
                      flexShrink: 0,
                    }}
                  >
                    D
                  </Box>
                  <Box sx={{ lineHeight: 1.12, pt: 0.25 }}>
                    {heroBrandWords.length >= 2 ? (
                      <>
                        <Typography
                          component="span"
                          sx={{
                            fontFamily: displayFont,
                            fontWeight: 800,
                            fontSize: { xs: '1.2rem', sm: '1.3rem' },
                            color: tc.cyan || theme.palette.info.main,
                            letterSpacing: '-0.02em',
                            display: 'block',
                          }}
                        >
                          {heroBrandWords.slice(0, -1).join(' ')}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{
                            fontFamily: displayFont,
                            fontWeight: 800,
                            fontSize: { xs: '1.05rem', sm: '1.15rem' },
                            color: tc.lime || theme.palette.success.main,
                            letterSpacing: '-0.02em',
                            display: 'block',
                          }}
                        >
                          {heroBrandWords[heroBrandWords.length - 1]}
                        </Typography>
                      </>
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: displayFont,
                          fontWeight: 800,
                          fontSize: '1.25rem',
                          color: tc.cyan || theme.palette.info.main,
                        }}
                      >
                        {heroBrandWords[0] || 'Diabetes Care'}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.9375rem', md: '1rem' },
                    lineHeight: 1.75,
                    maxWidth: 400,
                    mb: 2.5,
                  }}
                >
                  {siteDescription ||
                    'Advanced AI-powered diabetes risk assessment platform helping individuals take control of their health through comprehensive symptom analysis.'}
                </Typography>
                <Stack direction="row" spacing={1}>
                  {[
                    { Icon: GitHub, href: 'https://github.com' },
                    { Icon: LinkedIn, href: 'https://linkedin.com' },
                    { Icon: Twitter, href: 'https://twitter.com' },
                  ].map((social) => (
                    <IconButton
                      key={social.href}
                      component="a"
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      aria-label="Social link"
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        color: 'text.secondary',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          color: tc.cyan || theme.palette.info.main,
                          borderColor: alpha(tc.cyan || theme.palette.info.main, 0.45),
                          bgcolor: alpha(tc.cyan || theme.palette.info.main, 0.06),
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      {React.createElement(social.Icon, { sx: { fontSize: 20 } })}
                    </IconButton>
                  ))}
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                {isMobile ? (
                  <Box>
                    <Button
                      fullWidth
                      onClick={() => handleFooterToggle('product')}
                      endIcon={footerExpanded.product ? <ExpandLess /> : <ExpandMore />}
                      sx={{
                        justifyContent: 'space-between',
                        textTransform: 'none',
                        fontFamily: displayFont,
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        letterSpacing: '0.06em',
                        py: 1.5,
                        px: 2,
                        borderRadius: 2,
                        color: 'text.primary',
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': {
                          borderColor: alpha(tc.cyan || theme.palette.info.main, 0.35),
                          bgcolor: alpha(tc.cyan || theme.palette.info.main, 0.04),
                        },
                      }}
                    >
                      Product
                    </Button>
                    <Collapse in={footerExpanded.product}>
                      <Stack spacing={1.25} sx={{ pl: 1.5, pr: 1, py: 2 }}>
                        <Link href="#about" underline="none" sx={footerLinkSx(theme, tc)}>
                          Features
                        </Link>
                        <Link href="/symptom-assessment" underline="none" sx={footerLinkSx(theme, tc)}>
                          Assessment
                        </Link>
                        <Link href="#" underline="none" sx={footerLinkSx(theme, tc)}>
                          Analytics
                        </Link>
                        <Link href="#" underline="none" sx={footerLinkSx(theme, tc)}>
                          API
                        </Link>
                      </Stack>
                    </Collapse>
                  </Box>
                ) : (
                  <>
                    <Typography
                      sx={{
                        fontFamily: displayFont,
                        fontWeight: 800,
                        fontSize: '0.8125rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'text.primary',
                        mb: 2,
                        pb: 1,
                        borderBottom: `2px solid ${alpha(tc.cyan || theme.palette.info.main, 0.4)}`,
                        width: 'fit-content',
                      }}
                    >
                      Product
                    </Typography>
                    <Stack spacing={1.35}>
                      <Link href="#about" underline="none" sx={footerLinkSx(theme, tc)}>
                        Features
                      </Link>
                      <Link href="/symptom-assessment" underline="none" sx={footerLinkSx(theme, tc)}>
                        Assessment
                      </Link>
                      <Link href="#" underline="none" sx={footerLinkSx(theme, tc)}>
                        Analytics
                      </Link>
                      <Link href="#" underline="none" sx={footerLinkSx(theme, tc)}>
                        API
                      </Link>
                    </Stack>
                  </>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                {isMobile ? (
                  <Box>
                    <Button
                      fullWidth
                      onClick={() => handleFooterToggle('support')}
                      endIcon={footerExpanded.support ? <ExpandLess /> : <ExpandMore />}
                      sx={{
                        justifyContent: 'space-between',
                        textTransform: 'none',
                        fontFamily: displayFont,
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        letterSpacing: '0.06em',
                        py: 1.5,
                        px: 2,
                        borderRadius: 2,
                        color: 'text.primary',
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': {
                          borderColor: alpha(tc.cyan || theme.palette.info.main, 0.35),
                          bgcolor: alpha(tc.cyan || theme.palette.info.main, 0.04),
                        },
                      }}
                    >
                      Support
                    </Button>
                    <Collapse in={footerExpanded.support}>
                      <Stack spacing={1.25} sx={{ pl: 1.5, pr: 1, py: 2 }}>
                        <Link href="#" underline="none" sx={footerLinkSx(theme, tc)}>
                          Help Center
                        </Link>
                        <Link href="#" underline="none" sx={footerLinkSx(theme, tc)}>
                          Documentation
                        </Link>
                        <Link href="#contact" underline="none" sx={footerLinkSx(theme, tc)}>
                          Contact us
                        </Link>
                        <Link href="#" underline="none" sx={footerLinkSx(theme, tc)}>
                          Privacy Policy
                        </Link>
                      </Stack>
                    </Collapse>
                  </Box>
                ) : (
                  <>
                    <Typography
                      sx={{
                        fontFamily: displayFont,
                        fontWeight: 800,
                        fontSize: '0.8125rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'text.primary',
                        mb: 2,
                        pb: 1,
                        borderBottom: `2px solid ${alpha(tc.cyan || theme.palette.info.main, 0.4)}`,
                        width: 'fit-content',
                      }}
                    >
                      Support
                    </Typography>
                    <Stack spacing={1.35}>
                      <Link href="#" underline="none" sx={footerLinkSx(theme, tc)}>
                        Help Center
                      </Link>
                      <Link href="#" underline="none" sx={footerLinkSx(theme, tc)}>
                        Documentation
                      </Link>
                      <Link href="#contact" underline="none" sx={footerLinkSx(theme, tc)}>
                        Contact us
                      </Link>
                      <Link href="#" underline="none" sx={footerLinkSx(theme, tc)}>
                        Privacy Policy
                      </Link>
                    </Stack>
                  </>
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                {isMobile ? (
                  <Box>
                    <Button
                      fullWidth
                      onClick={() => handleFooterToggle('contact')}
                      endIcon={footerExpanded.contact ? <ExpandLess /> : <ExpandMore />}
                      sx={{
                        justifyContent: 'space-between',
                        textTransform: 'none',
                        fontFamily: displayFont,
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        letterSpacing: '0.06em',
                        py: 1.5,
                        px: 2,
                        borderRadius: 2,
                        color: 'text.primary',
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': {
                          borderColor: alpha(tc.cyan || theme.palette.info.main, 0.35),
                          bgcolor: alpha(tc.cyan || theme.palette.info.main, 0.04),
                        },
                      }}
                    >
                      Contact
                    </Button>
                    <Collapse in={footerExpanded.contact}>
                      <Stack spacing={1.75} sx={{ pl: 0.5, py: 2 }}>
                        <FooterContactRow icon={Email}>
                          <Link
                            href={`mailto:${contactEmail || 'support@diabetescare.com'}`}
                            underline="none"
                            sx={footerLinkSx(theme, tc)}
                          >
                            {contactEmail || 'support@diabetescare.com'}
                          </Link>
                        </FooterContactRow>
                        <FooterContactRow icon={Phone}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9375rem' }}>
                            {contactPhone || '+92 323 300 4420'}
                          </Typography>
                        </FooterContactRow>
                        <FooterContactRow icon={LocationOn}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9375rem' }}>
                            Islamabad, Pakistan
                          </Typography>
                        </FooterContactRow>
                      </Stack>
                    </Collapse>
                  </Box>
                ) : (
                  <>
                    <Typography
                      sx={{
                        fontFamily: displayFont,
                        fontWeight: 800,
                        fontSize: '0.8125rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'text.primary',
                        mb: 2,
                        pb: 1,
                        borderBottom: `2px solid ${alpha(tc.cyan || theme.palette.info.main, 0.4)}`,
                        width: 'fit-content',
                      }}
                    >
                      Contact
                    </Typography>
                    <Stack spacing={1.75}>
                      <FooterContactRow icon={Email}>
                        <Link
                          href={`mailto:${contactEmail || 'support@diabetescare.com'}`}
                          underline="none"
                          sx={footerLinkSx(theme, tc)}
                        >
                          {contactEmail || 'support@diabetescare.com'}
                        </Link>
                      </FooterContactRow>
                      <FooterContactRow icon={Phone}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9375rem' }}>
                          {contactPhone || '+92 323 300 4420'}
                        </Typography>
                      </FooterContactRow>
                      <FooterContactRow icon={LocationOn}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9375rem' }}>
                          Islamabad, Pakistan
                        </Typography>
                      </FooterContactRow>
                    </Stack>
                  </>
                )}
              </Grid>
            </Grid>

            <Divider
              sx={{
                my: { xs: 4, md: 5 },
                borderColor: alpha(theme.palette.divider, 0.85),
              }}
            />
            <Box
              sx={{
                textAlign: 'center',
                px: { xs: 1, sm: 0 },
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.8125rem', md: '0.875rem' },
                  lineHeight: 1.65,
                }}
              >
                © {new Date().getFullYear()} {siteTitle || 'DiabetesCare'}. All rights reserved.
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {' '}
                  · Built for better health outcomes
                </Box>
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* Article Modal */}
      <ArticleModal
        open={articleModal.open}
        onClose={handleCloseArticleModal}
        article={articleModal.article}
        onArticleClick={handleArticleClick}
      />
    </Box>
  );
};

export default LandingPage;
