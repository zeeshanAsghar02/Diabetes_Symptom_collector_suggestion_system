import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import { Star, FormatQuote } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { fetchAllFeedback } from '../../utils/api';

/** Framer wrapper — ESLint (no react/jsx-uses-vars) does not treat `<motion.div>` as using `motion`. */
const MotionListItem = motion.div;

const staticTestimonials = [
  {
    _id: 'static-1',
    name: 'Sarah Johnson',
    role: 'Diabetes Patient',
    comment:
      'This system helped me understand my symptoms better and provided actionable recommendations. The AI assessment was incredibly accurate!',
    avatar: 'SJ',
    rating: 5,
    isStatic: true,
  },
  {
    _id: 'static-2',
    name: 'Dr. Michael Chen',
    role: 'Endocrinologist',
    comment:
      'As a healthcare professional, I recommend this tool to my patients. It provides valuable insights and helps with early detection.',
    avatar: 'MC',
    rating: 5,
    isStatic: true,
  },
  {
    _id: 'static-3',
    name: 'Emily Rodriguez',
    role: 'Health Coach',
    comment:
      'The personalized recommendations are spot-on. My clients love how easy it is to track their symptoms and get instant feedback.',
    avatar: 'ER',
    rating: 5,
    isStatic: true,
  },
];

export default function TestimonialsSection() {
  const theme = useTheme();
  const tc = theme.palette.brandTelecare || {};
  const displayFont =
    theme.typography.marketingHeadline?.fontFamily || theme.typography.fontFamily;
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    loadTestimonials();
  }, []);

  useEffect(() => {
    // Re-fetch when user returns to tab so recent feedback appears without hard reload.
    const handleFocus = () => {
      loadTestimonials();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const startInfiniteScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || testimonials.length === 0) return;

    if (container.scrollWidth <= container.clientWidth) {
      return;
    }

    const scroll = () => {
      if (!container) {
        return;
      }

      if (isHoveredRef.current) {
        scrollAnimationRef.current = requestAnimationFrame(scroll);
        return;
      }

      container.scrollLeft += 0.5;

      const maxScroll = container.scrollWidth / 2;
      if (container.scrollLeft >= maxScroll - 5) {
        container.scrollLeft = 0;
      }

      scrollAnimationRef.current = requestAnimationFrame(scroll);
    };

    container.scrollLeft = 0;
    scrollAnimationRef.current = requestAnimationFrame(scroll);
  }, [testimonials]);

  useEffect(() => {
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }

    if (testimonials.length > 0 && !loading) {
      const timer = setTimeout(() => {
        startInfiniteScroll();
      }, 200);

      return () => {
        clearTimeout(timer);
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
          scrollAnimationRef.current = null;
        }
      };
    }
  }, [testimonials, loading, startInfiniteScroll]);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      let allTestimonials = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const data = await fetchAllFeedback(page, 50);
        const feedback = data.feedback || [];
        allTestimonials = [...allTestimonials, ...feedback];

        hasMore = page < (data.pagination?.pages || 1);
        page++;
      }

      // Show freshest entries first so newly submitted feedback appears sooner.
      allTestimonials.sort((a, b) => new Date(b.submitted_on || 0) - new Date(a.submitted_on || 0));

      const MIN_TESTIMONIALS_FOR_SMOOTH_SCROLL = 4;

      let testimonialsToUse = [];

      if (allTestimonials.length === 0) {
        testimonialsToUse = staticTestimonials;
      } else if (allTestimonials.length < MIN_TESTIMONIALS_FOR_SMOOTH_SCROLL) {
        const placeholdersNeeded = MIN_TESTIMONIALS_FOR_SMOOTH_SCROLL - allTestimonials.length;
        const placeholders = staticTestimonials.slice(0, placeholdersNeeded);
        testimonialsToUse = [...allTestimonials, ...placeholders];
      } else {
        testimonialsToUse = allTestimonials;
      }

      const duplicatedTestimonials = [...testimonialsToUse, ...testimonialsToUse];

      setTestimonials(duplicatedTestimonials);
    } catch (error) {
      console.error('Failed to load testimonials:', error);
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
  };

  const getInitials = (name) => {
    if (!name || name === 'Anonymous') return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  /** Brand-consistent avatar swatches (TeleCare cyan / lime / blue). */
  const getAvatarSwatch = (name) => {
    const key = name || 'Anonymous';
    const swatches = [
      { bg: tc.cyan || theme.palette.info.main, fg: tc.onGradient || '#FFFFFF' },
      { bg: tc.lime || theme.palette.success.main, fg: '#0F172A' },
      { bg: tc.navPillBlue || theme.palette.primary.main, fg: '#FFFFFF' },
    ];
    const index =
      Math.abs(key.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % swatches.length;
    return swatches[index];
  };

  const starColor = theme.palette.mode === 'light' ? '#CA8A04' : '#EAB308';

  if (loading) {
    return null;
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <Box
      component="section"
      aria-labelledby="testimonials-heading"
      sx={{
        py: { xs: 7, md: 10 },
        overflow: 'hidden',
        background:
          theme.palette.mode === 'light'
            ? `linear-gradient(180deg, ${alpha(tc.cyan || theme.palette.info.main, 0.06)} 0%, ${theme.palette.background.paper} 18%, ${alpha(theme.palette.background.default, 0.85)} 100%)`
            : `linear-gradient(180deg, ${alpha(tc.cyan || theme.palette.info.main, 0.08)} 0%, ${theme.palette.background.paper} 22%, ${theme.palette.background.default} 100%)`,
      }}
    >
      <Container maxWidth="lg">
        <Stack alignItems="center" spacing={2} sx={{ mb: { xs: 5, md: 6 }, textAlign: 'center' }}>
          <Box
            sx={{
              px: 1.75,
              py: 0.5,
              borderRadius: 999,
              border: `1px solid ${alpha(tc.cyan || theme.palette.info.main, 0.35)}`,
              bgcolor: alpha(tc.cyan || theme.palette.info.main, 0.06),
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: tc.cyan || theme.palette.info.main,
                fontSize: '0.7rem',
              }}
            >
              Testimonials
            </Typography>
          </Box>
          <Typography
            id="testimonials-heading"
            component="h2"
            sx={{
              fontFamily: displayFont,
              fontWeight: 800,
              fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'text.primary',
              maxWidth: 720,
            }}
          >
            What our users say
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              maxWidth: 520,
              lineHeight: 1.65,
              fontSize: { xs: '0.9375rem', md: '1.0625rem' },
            }}
          >
            Trusted by patients and healthcare professionals worldwide
          </Typography>
        </Stack>

        <Box
          ref={scrollContainerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={{
            display: 'flex',
            gap: { xs: 2, md: 3 },
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollBehavior: 'auto',
            cursor: 'grab',
            userSelect: 'none',
            WebkitOverflowScrolling: 'touch',
            width: '100%',
            maxWidth: '100%',
            mx: { xs: -1, sm: 0 },
            px: { xs: 1, sm: 0 },
            '&:active': {
              cursor: 'grabbing',
            },
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            pb: 2,
            willChange: 'scroll-position',
            scrollSnapType: 'none',
          }}
        >
          {testimonials.map((testimonial, index) => {
            const isStatic = testimonial.isStatic === true;
            const userName = isStatic
              ? testimonial.name
              : testimonial.is_anonymous
                ? 'Anonymous'
                : testimonial.user?.fullName || 'User';
            const userComment = testimonial.comment || 'Great experience!';
            const userRating = testimonial.rating || 5;
            const userRole = isStatic ? testimonial.role : `${testimonial.rating}★ rating`;
            const avatarInitials = isStatic
              ? testimonial.avatar
              : testimonial.is_anonymous || !testimonial.user?.fullName
                ? 'U'
                : getInitials(testimonial.user.fullName);
            const swatch = getAvatarSwatch(userName);
            const avatarSrc = isStatic
              ? undefined
              : testimonial.is_anonymous
                ? undefined
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.user?.fullName || 'User')}&background=${String(swatch.bg).replace('#', '').toUpperCase()}&color=${swatch.fg === '#0F172A' ? '0F172A' : 'fff'}&size=128`;

            return (
              <MotionListItem
                key={`${testimonial._id || `static-${index}`}-${index}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.36) }}
                style={{ flexShrink: 0 }}
              >
                <Card
                  elevation={0}
                  sx={{
                    width: { xs: 'min(calc(100vw - 56px), 360px)', sm: 360 },
                    minWidth: { xs: 'min(calc(100vw - 56px), 360px)', sm: 360 },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    boxShadow:
                      theme.palette.mode === 'light'
                        ? `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}, 0 12px 32px ${alpha(theme.palette.common.black, 0.06)}`
                        : `0 1px 2px ${alpha(theme.palette.common.black, 0.2)}, 0 12px 32px ${alpha(theme.palette.common.black, 0.35)}`,
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      borderColor: alpha(tc.cyan || theme.palette.info.main, 0.45),
                      boxShadow:
                        theme.palette.mode === 'light'
                          ? `0 1px 2px ${alpha(theme.palette.common.black, 0.06)}, 0 20px 48px ${alpha(tc.cyan || theme.palette.info.main, 0.14)}`
                          : `0 1px 2px ${alpha(theme.palette.common.black, 0.25)}, 0 20px 48px ${alpha(tc.cyan || theme.palette.info.main, 0.2)}`,
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      p: { xs: 3, sm: 3.75 },
                      display: 'flex',
                      flexDirection: 'column',
                      flexGrow: 1,
                      height: '100%',
                      '&:last-child': { pb: { xs: 3, sm: 3.75 } },
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                      <Stack direction="row" spacing={0.35} alignItems="center" aria-hidden>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            sx={{
                              color:
                                i < Math.round(userRating)
                                  ? starColor
                                  : alpha(theme.palette.action.disabled, 0.5),
                              fontSize: 18,
                            }}
                          />
                        ))}
                      </Stack>
                    </Stack>

                    <Box sx={{ position: 'relative', flexGrow: 1, mb: 3, pl: 0.5 }}>
                      <FormatQuote
                        sx={{
                          position: 'absolute',
                          top: -6,
                          left: -4,
                          fontSize: 36,
                          color: alpha(tc.cyan || theme.palette.info.main, 0.18),
                          transform: 'scaleX(-1)',
                          pointerEvents: 'none',
                        }}
                        aria-hidden
                      />
                      <Typography
                        component="blockquote"
                        variant="body1"
                        sx={{
                          position: 'relative',
                          zIndex: 1,
                          m: 0,
                          pl: 2.25,
                          color: 'text.secondary',
                          fontStyle: 'normal',
                          fontWeight: 400,
                          lineHeight: 1.7,
                          fontSize: '1rem',
                        }}
                      >
                        {userComment}
                      </Typography>
                    </Box>

                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                      <Avatar
                        sx={{
                          bgcolor: swatch.bg,
                          color: swatch.fg,
                          width: 52,
                          height: 52,
                          fontSize: '1rem',
                          fontWeight: 700,
                          border: `2px solid ${alpha(swatch.bg, 0.25)}`,
                        }}
                        src={avatarSrc}
                      >
                        {avatarInitials}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            color: 'text.primary',
                            lineHeight: 1.35,
                            fontSize: '1rem',
                          }}
                        >
                          {userName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25, lineHeight: 1.45 }}>
                          {userRole}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </MotionListItem>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
