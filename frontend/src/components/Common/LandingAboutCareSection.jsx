import React from 'react';
import { Box, Container, Typography, Button, Grid, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';

/** Stock photo (Unsplash) — replace with your own asset in `/public` when ready. Not the user reference upload. */
const ABOUT_IMAGE_SRC =
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1280&q=80';
const ABOUT_IMAGE_SRCSET =
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=960&q=80 960w, https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1280&q=80 1280w, https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80 1600w';

const sectionReveal = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

/** Split site title for green kicker (first part + last word for ®). Rendered on one line. */
function brandEyebrowLines(siteTitle) {
  const t = (siteTitle || '').trim();
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return {
      first: `We're All About You at ${parts.slice(0, -1).join(' ')}`,
      lastWord: parts[parts.length - 1],
    };
  }
  return { first: "We're All About You at", lastWord: t || 'TeleCare' };
}

/**
 * Marketing “about” block: headline, short story, CTA, supporting image.
 * Anchors `#about` for landing nav; keep layout airy (generous spacing, single visual focus).
 */
export default function LandingAboutCareSection({ siteTitle = 'Diabetes TeleCare' }) {
  const theme = useTheme();
  const brand = theme.palette.brandTelecare || {};
  const accent = brand.lime || theme.palette.success.main;
  const headlineMuted = theme.palette.text.secondary;
  const ctaBg = brand.navPillBlue || theme.palette.primary.main;

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const { first: greenFirst, lastWord: greenLast } = brandEyebrowLines(siteTitle);

  return (
    <Box
      id="about"
      component="section"
      sx={{
        mt: { xs: 5, sm: 6, md: 8, lg: 9 },
        mb: { xs: 6, sm: 7, md: 9, lg: 10 },
        py: { xs: 8, sm: 10, md: 12, lg: 14 },
        minHeight: { md: 'min(92vh, 980px)' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        bgcolor: theme.palette.background.paper,
        scrollMarginTop: { xs: '100px', md: '120px' },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          px: { xs: 3, sm: 4, md: 5 },
          py: { xs: 2, md: 3 },
          fontFamily: theme.typography.fontFamily,
          width: '100%',
          '& .MuiTypography-root': { fontFamily: 'inherit' },
        }}
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionReveal}
        >
          <Box
            sx={{
              textAlign: 'center',
              maxWidth: { xs: '100%', md: 1200, lg: 1320 },
              mx: 'auto',
              mb: { xs: 6, sm: 7, md: 9, lg: 10 },
              px: { xs: 0, sm: 1, md: 2 },
            }}
          >
            <motion.div variants={fadeUp}>
              <Typography
                component="h2"
                sx={{
                  ...theme.typography.marketingEyebrow,
                  fontWeight: 800,
                  fontSize: { xs: '1.625rem', sm: '1.875rem', md: '2.25rem', lg: '2.5rem' },
                  lineHeight: { xs: 1.34, md: 1.22 },
                  color: accent,
                  letterSpacing: '0.01em',
                  mb: { xs: 2.5, md: 3.25 },
                }}
              >
                {greenFirst} {greenLast}
                <Box
                  component="span"
                  sx={{
                    fontSize: '0.52em',
                    verticalAlign: 'super',
                    ml: 0.15,
                    fontWeight: 800,
                  }}
                >
                  ®
                </Box>
                :
              </Typography>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Typography
                component="p"
                sx={{
                  ...theme.typography.marketingHeadline,
                  fontWeight: 900,
                  fontSize: { xs: '2.375rem', sm: '2.875rem', md: '3.5rem', lg: '3.875rem' },
                  lineHeight: { xs: 1.2, md: 1.14 },
                  color: theme.palette.text.primary,
                  letterSpacing: '-0.02em',
                  mb: { xs: 3.25, md: 4 },
                  maxWidth: '100%',
                }}
              >
                Personalized Care for Every Stage of
                <br />
                Diabetes
              </Typography>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={1.5}
                sx={{ color: headlineMuted }}
                aria-hidden
              >
                <Stack direction="row" spacing={0.875} alignItems="center">
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      sx={{
                        width: { xs: 6, sm: 7 },
                        height: { xs: 6, sm: 7 },
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.text.primary, 0.2),
                      }}
                    />
                  ))}
                </Stack>
                <Box
                  sx={{
                    width: { xs: 48, sm: 64 },
                    height: 4,
                    borderRadius: 1,
                    bgcolor: accent,
                  }}
                />
              </Stack>
            </motion.div>
          </Box>

          <Grid container spacing={{ xs: 4, md: 6, lg: 8 }} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 2, md: 1 } }}>
              <motion.div variants={fadeUp}>
                <Stack spacing={{ xs: 2.5, md: 3 }} sx={{ maxWidth: 560 }}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{
                      ...theme.typography.body1,
                      fontSize: { xs: '1.125rem', md: '1.1875rem' },
                      lineHeight: 1.75,
                    }}
                  >
                    We believe diabetes care should fit your life—not the other way around. Our platform
                    pairs thoughtful assessment with practical guidance you can use between clinic visits.
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{
                      ...theme.typography.body1,
                      fontSize: { xs: '1.125rem', md: '1.1875rem' },
                      lineHeight: 1.8,
                    }}
                  >
                    Whether you are newly diagnosed, tightening long-term control, or supporting someone
                    you care about, we focus on clear information and steady, respectful follow-up.
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{
                      ...theme.typography.body1,
                      fontSize: { xs: '1.125rem', md: '1.1875rem' },
                      lineHeight: 1.8,
                    }}
                  >
                    From symptom awareness to everyday habits, each step is designed to be easy to
                    understand, light on noise, and aligned with the plan you build with your care team.
                  </Typography>
                  <Box sx={{ pt: { xs: 1.5, md: 2 } }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={scrollToHowItWorks}
                      sx={{
                        ...theme.typography.button,
                        px: { xs: 3.5, sm: 4 },
                        py: 1.5,
                        borderRadius: 1.5,
                        fontWeight: 700,
                        fontSize: { xs: '1.0625rem', md: '1.125rem' },
                        textTransform: 'none',
                        bgcolor: ctaBg,
                        boxShadow: 'none',
                        '&:hover': {
                          bgcolor: alpha(ctaBg, 0.88),
                          boxShadow: `0 8px 24px ${alpha(ctaBg, 0.35)}`,
                        },
                      }}
                    >
                      More About Us
                    </Button>
                  </Box>
                </Stack>
              </motion.div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 1, md: 2 } }}>
              <motion.div variants={fadeUp}>
                <Box
                  sx={{
                    borderRadius: { xs: 3, md: 4 },
                    overflow: 'hidden',
                    border: `1px solid ${alpha(accent, 0.35)}`,
                    boxShadow:
                      theme.palette.mode === 'light'
                        ? `0 20px 48px ${alpha(theme.palette.common.black, 0.08)}`
                        : `0 16px 40px ${alpha(theme.palette.common.black, 0.35)}`,
                    lineHeight: 0,
                    maxWidth: { xs: 520, md: '100%' },
                    mx: { xs: 'auto', md: 0 },
                    pl: { md: 1 },
                  }}
                >
                  <Box
                    component="img"
                    src={ABOUT_IMAGE_SRC}
                    srcSet={ABOUT_IMAGE_SRCSET}
                    sizes="(max-width: 900px) 100vw, 50vw"
                    alt="Healthcare setting: clinician and patient discussion, representing personalized diabetes care and support."
                    loading="lazy"
                    decoding="async"
                    sx={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
}
