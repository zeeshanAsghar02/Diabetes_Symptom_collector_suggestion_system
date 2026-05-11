import React from 'react';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

/** Reference palette — navy headline, lime accent, deep indigo CTA, charcoal subcopy */
const CTA_NAVY = '#1D3557';
const CTA_LIME = '#72C048';
const CTA_BUTTON = '#281AC0';
const CTA_SUBTEXT = '#333333';

/**
 * Articles / knowledge CTA — soft blue gradient, Poppins-style display type, “Read now” → `/articles`.
 */
export default function LandingKnowledgeCtaSection() {
  const theme = useTheme();
  const navigate = useNavigate();
  const displayFont =
    theme.typography.marketingHeadline?.fontFamily || theme.typography.fontFamily;

  return (
    <Box
      component="section"
      aria-labelledby="landing-knowledge-cta-heading"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 11, sm: 12, md: 14, lg: 16 },
        px: { xs: 2, sm: 3 },
        minHeight: { xs: 'min-content', sm: 'min(52vh, 520px)', md: 'min(58vh, 620px)', lg: 'min(62vh, 680px)' },
        display: 'flex',
        alignItems: 'center',
        background:
          theme.palette.mode === 'light'
            ? 'linear-gradient(180deg, #E8F4FC 0%, #F5FAFF 38%, #FFFFFF 72%, #F0F7FF 100%)'
            : `linear-gradient(180deg, ${alpha('#29ABE2', 0.12)} 0%, ${theme.palette.background.paper} 50%, ${alpha('#29ABE2', 0.08)} 100%)`,
      }}
    >
      {/* Soft abstract shapes */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: { xs: '-15%', md: '-20%' },
          right: { xs: '-25%', md: '-15%' },
          width: { xs: '70%', md: '52%' },
          height: { xs: '55%', md: '65%' },
          borderRadius: '50%',
          bgcolor: alpha('#29ABE2', theme.palette.mode === 'light' ? 0.12 : 0.08),
          filter: 'blur(48px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          bottom: { xs: '-20%', md: '-25%' },
          left: { xs: '-30%', md: '-18%' },
          width: { xs: '75%', md: '55%' },
          height: { xs: '50%', md: '60%' },
          borderRadius: '50%',
          bgcolor: alpha('#7AC943', theme.palette.mode === 'light' ? 0.08 : 0.06),
          filter: 'blur(56px)',
          pointerEvents: 'none',
        }}
      />

      <Container
        maxWidth="md"
        sx={{
          position: 'relative',
          zIndex: 1,
          py: { xs: 1, md: 2 },
          width: '100%',
        }}
      >
        <Stack alignItems="center" textAlign="center" spacing={0}>
          <Typography
            id="landing-knowledge-cta-heading"
            component="h2"
            sx={{
              fontFamily: displayFont,
              fontWeight: 900,
              color: CTA_NAVY,
              fontSize: { xs: '2.125rem', sm: '2.75rem', md: '3.35rem', lg: '3.875rem' },
              lineHeight: { xs: 1.12, md: 1.1 },
              letterSpacing: { xs: '-0.028em', md: '-0.03em' },
            }}
          >
            Level Up Your Diabetes
          </Typography>
          <Typography
            component="p"
            sx={{
              fontFamily: displayFont,
              fontWeight: 800,
              color: CTA_LIME,
              fontSize: { xs: '2.125rem', sm: '2.75rem', md: '3.35rem', lg: '3.875rem' },
              lineHeight: { xs: 1.12, md: 1.1 },
              letterSpacing: { xs: '-0.028em', md: '-0.03em' },
              mt: { xs: 0.5, sm: 0.75, md: 1 },
            }}
          >
            Knowledge in Minutes!
          </Typography>

          <Typography
            component="p"
            sx={{
              fontFamily: theme.typography.fontFamily,
              fontWeight: 500,
              color: CTA_SUBTEXT,
              fontSize: { xs: '1.0625rem', sm: '1.125rem', md: '1.1875rem' },
              lineHeight: 1.65,
              maxWidth: 580,
              mt: { xs: 2.5, md: 3.25 },
              px: { xs: 1, sm: 0 },
              ...(theme.palette.mode === 'dark' && { color: alpha('#FFFFFF', 0.82) }),
            }}
          >
            Bite-sized tips & hacks for thriving with diabetes—from our doctor specialists.
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/articles')}
            sx={{
              mt: { xs: 3.5, md: 4 },
              px: { xs: 4.5, sm: 5.5 },
              py: { xs: 1.5, md: 1.65 },
              fontFamily: theme.typography.fontFamily,
              fontWeight: 600,
              fontSize: { xs: '1rem', md: '1.0625rem' },
              textTransform: 'none',
              color: '#FFFFFF',
              bgcolor: CTA_BUTTON,
              borderRadius: '6px',
              boxShadow: '0 10px 28px rgba(40, 26, 192, 0.35)',
              '&:hover': {
                bgcolor: alpha(CTA_BUTTON, 0.92),
                boxShadow: '0 12px 32px rgba(40, 26, 192, 0.42)',
              },
            }}
          >
            Read now
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
