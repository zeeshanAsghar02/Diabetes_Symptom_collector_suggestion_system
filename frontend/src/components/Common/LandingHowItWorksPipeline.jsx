import React from 'react';
import { Box, Container, Typography, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  Assessment,
  AutoAwesome,
  Insights,
  OutlinedFlag,
} from '@mui/icons-material';

const MotionDiv = motion.div;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const pipelineSteps = [
  {
    title: 'Share your answers',
    description:
      'Walk through a guided questionnaire about symptoms, habits, and history—at your own pace.',
    Icon: Assessment,
  },
  {
    title: 'We connect the details',
    description:
      'Your responses are organized so important patterns stand out, in plain language.',
    Icon: AutoAwesome,
  },
  {
    title: 'See your risk snapshot',
    description:
      'Review a clear summary of what your inputs suggest about diabetes risk and why it matters.',
    Icon: Insights,
  },
  {
    title: 'Take the next step',
    description:
      'Move into personalized suggestions, articles, and tools that match where you are today.',
    Icon: OutlinedFlag,
  },
];

function ConnectorHorizontal({ lineStart, lineEnd, alignPt }) {
  return (
    <Box
      sx={{
        display: { xs: 'none', lg: 'block' },
        flex: '1 1 0',
        minWidth: 28,
        maxWidth: 160,
        pt: alignPt,
        alignSelf: 'flex-start',
      }}
      aria-hidden
    >
      <Box
        sx={{
          height: 3,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${alpha(lineStart, 0.45)}, ${alpha(lineEnd, 0.9)})`,
        }}
      />
    </Box>
  );
}

/**
 * “How it works” — flow pipeline (horizontal on lg+, vertical timeline on smaller screens).
 */
export default function LandingHowItWorksPipeline({ siteTitle }) {
  const theme = useTheme();
  const tc = theme.palette.brandTelecare || {};
  const lineStart = tc.cyan || theme.palette.info.main;
  const lineEnd = tc.lime || theme.palette.success.main;
  /** Same cyan → lime mix as `UniversalHeader` tier 1 (`topBarGradient`). */
  const headerBarGradient =
    tc.topBarGradient || `linear-gradient(90deg, ${lineStart} 0%, ${lineEnd} 100%)`;
  const paper = theme.palette.background.paper;
  /** Wash on top of brand gradient so headings, body, and icons stay legible. */
  const sectionBackground =
    theme.palette.mode === 'light'
      ? `linear-gradient(180deg, ${alpha(paper, 0.88)} 0%, ${alpha(paper, 0.92)} 100%), ${headerBarGradient}`
      : `linear-gradient(180deg, ${alpha(paper, 0.82)} 0%, ${alpha(paper, 0.78)} 100%), linear-gradient(90deg, ${alpha(lineStart, 0.32)} 0%, ${alpha(lineEnd, 0.26)} 100%)`;
  const displayFont =
    theme.typography.marketingHeadline?.fontFamily || theme.typography.fontFamily;

  const nodeLg = 84;
  const nodeXs = 58;
  /** Align connector bar with vertical center of circular node (line is 3px tall). */
  const connectorTopPad = `${nodeLg / 2 - 1.5}px`;

  const nodeSx = {
    width: { xs: nodeXs, lg: nodeLg },
    height: { xs: nodeXs, lg: nodeLg },
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: `2px solid ${alpha(lineStart, 0.35)}`,
    bgcolor:
      theme.palette.mode === 'light' ? alpha(lineStart, 0.07) : alpha(lineStart, 0.14),
    color: lineStart,
    boxShadow:
      theme.palette.mode === 'light'
        ? `0 6px 22px ${alpha(lineStart, 0.12)}`
        : 'none',
  };

  return (
    <Box
      id="how-it-works"
      component="section"
      sx={{
        pt: { xs: 9, sm: 10, md: 12, lg: 14 },
        pb: { xs: 9, sm: 10, md: 12, lg: 14 },
        minHeight: { xs: 'auto', md: 'min(76vh, 820px)' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: sectionBackground,
        scrollMarginTop: { xs: '96px', md: '112px' },
      }}
    >
      <Container maxWidth="lg" sx={{ width: '100%' }}>
        <MotionDiv
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07 } },
          }}
        >
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8, lg: 9 } }}>
            <MotionDiv variants={itemVariants}>
              <Typography
                variant="h3"
                component="h2"
                sx={{
                  fontFamily: displayFont,
                  fontWeight: 800,
                  color: 'text.primary',
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  mb: 2,
                }}
              >
                How {siteTitle || 'DiabetesCare'} Works
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  maxWidth: 640,
                  mx: 'auto',
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  lineHeight: 1.7,
                  px: { xs: 1.5, sm: 2, md: 0 },
                }}
              >
                A simple four-step flow—from what you tell us to guidance you can use right away.
              </Typography>
            </MotionDiv>
          </Box>

          {/* Desktop / large tablet: horizontal pipeline */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'flex-start',
              justifyContent: 'center',
              gap: { lg: 1, xl: 2 },
              width: '100%',
              maxWidth: 1280,
              mx: 'auto',
              px: { lg: 1, xl: 2 },
            }}
          >
            {pipelineSteps.map((step, index) => {
              const Icon = step.Icon;
              const isLast = index === pipelineSteps.length - 1;
              return (
                <React.Fragment key={step.title}>
                  <MotionDiv
                    variants={itemVariants}
                    style={{ flex: '1 1 0', minWidth: 0, maxWidth: 288 }}
                  >
                    <Stack alignItems="center" spacing={2.75} textAlign="center" sx={{ px: 0.5 }}>
                      <Box sx={nodeSx}>
                        <Icon sx={{ fontSize: { xs: 28, lg: 38 } }} />
                      </Box>
                      <Typography
                        variant="overline"
                        sx={{
                          color: alpha(lineStart, 0.9),
                          fontWeight: 700,
                          letterSpacing: '0.12em',
                          lineHeight: 1.3,
                          mt: 0.25,
                        }}
                      >
                        Step {index + 1}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        component="h3"
                        sx={{
                          fontWeight: 700,
                          fontSize: { lg: '1.125rem' },
                          lineHeight: 1.4,
                          px: { lg: 0.5 },
                        }}
                      >
                        {step.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          lineHeight: 1.75,
                          fontSize: { lg: '0.9375rem' },
                          maxWidth: 280,
                          mx: 'auto',
                        }}
                      >
                        {step.description}
                      </Typography>
                    </Stack>
                  </MotionDiv>
                  {!isLast && (
                    <ConnectorHorizontal
                      lineStart={lineStart}
                      lineEnd={lineEnd}
                      alignPt={connectorTopPad}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </Box>

          {/* Mobile / tablet: vertical flow */}
          <Stack
            spacing={0}
            sx={{
              display: { xs: 'flex', lg: 'none' },
              maxWidth: 580,
              mx: 'auto',
              px: { xs: 0.5, sm: 1 },
            }}
          >
            {pipelineSteps.map((step, index) => {
              const Icon = step.Icon;
              const isLast = index === pipelineSteps.length - 1;
              return (
                <MotionDiv key={step.title} variants={itemVariants}>
                  <Stack
                    direction="row"
                    spacing={2.5}
                    alignItems="flex-start"
                    sx={{ pb: isLast ? 0 : { xs: 3, sm: 3.5 } }}
                  >
                    <Stack alignItems="center" sx={{ width: nodeXs, flexShrink: 0 }}>
                      <Box sx={nodeSx}>
                        <Icon sx={{ fontSize: 28 }} />
                      </Box>
                      {!isLast && (
                        <Box
                          sx={{
                            width: 2,
                            flex: 1,
                            minHeight: { xs: 36, sm: 40 },
                            my: 1,
                            borderRadius: 1,
                            background: `linear-gradient(180deg, ${alpha(lineStart, 0.4)}, ${alpha(lineEnd, 0.65)})`,
                          }}
                          aria-hidden
                        />
                      )}
                    </Stack>
                    <Box sx={{ pt: 0.75, pb: 0 }}>
                      <Typography
                        variant="overline"
                        sx={{
                          color: alpha(lineStart, 0.9),
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          display: 'block',
                          mb: 0.75,
                        }}
                      >
                        Step {index + 1}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        component="h3"
                        sx={{
                          fontWeight: 700,
                          fontSize: '1.0625rem',
                          mb: 1,
                          lineHeight: 1.4,
                        }}
                      >
                        {step.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.75, fontSize: '0.9375rem' }}
                      >
                        {step.description}
                      </Typography>
                    </Box>
                  </Stack>
                </MotionDiv>
              );
            })}
          </Stack>
        </MotionDiv>
      </Container>
    </Box>
  );
}
