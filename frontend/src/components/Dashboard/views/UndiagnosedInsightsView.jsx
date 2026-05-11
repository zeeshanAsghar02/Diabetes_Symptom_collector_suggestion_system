import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDateFormat } from '../../../hooks/useDateFormat';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Popover,
  alpha
} from '@mui/material';
import {
  FavoriteBorder as FavoriteBorderIcon,
  TrendingUp as TrendingUpIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Bolt as BoltIcon,
  ChevronRight as ChevronRightIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  MenuBook as MenuBookIcon,
  ArrowOutward as ArrowOutwardIcon,
} from '@mui/icons-material';

// Import components
import ProgressDonut from '../../DashboardNew/ProgressDonut';
import ActivityTimeline from '../../DashboardNew/ActivityTimeline';
import ThemeToggle from '../../Common/ThemeToggle';

function UndiagnosedInsightsView({
  diseaseData,
  completionPct,
  activityItems,
  assessmentSummary,
  user
}) {
  const { formatDate } = useDateFormat();
  const navigate = useNavigate();
  const answeredQuestions = diseaseData?.answeredQuestions ?? 0;
  const totalQuestions = diseaseData?.totalQuestions ?? 0;
  const progress = Number.isFinite(completionPct) ? completionPct : 0;
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const accountActive = user?.isActive ?? user?.active ?? true;
  const accountStatusLabel = accountActive ? 'Active' : 'Inactive';
  const statusColor = accountActive ? '#16A34A' : '#DC2626';

  const openProfilePopover = (event) => setProfileAnchorEl(event.currentTarget);
  const closeProfilePopover = () => setProfileAnchorEl(null);
  const isProfilePopoverOpen = Boolean(profileAnchorEl);

  return (
    <Box>
      {/* Component 1: Welcome header + KPI strip + assessment hero */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            mb: 2.25,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1.25,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.1 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.25 }}>
                Welcome back, {user?.fullName?.split(' ')[0] || 'Patient'}! 👋
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  Here&apos;s your health overview for today.
                </Typography>
                <Chip
                  size="small"
                  label={`Status: ${accountStatusLabel}`}
                  sx={{
                    fontWeight: 700,
                    bgcolor: alpha(statusColor, 0.12),
                    color: statusColor,
                    border: `1px solid ${alpha(statusColor, 0.3)}`,
                  }}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: { xs: 0, sm: 0.2 }, display: 'flex', alignItems: 'center', gap: 0.7 }}>
            <ThemeToggle size="medium" />
            <IconButton
              onClick={openProfilePopover}
              sx={{
                p: 0.25,
                borderRadius: '50%',
                border: `1px solid ${alpha('#4F46E5', 0.24)}`,
                bgcolor: alpha('#4F46E5', 0.05),
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: '#4F46E5',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                }}
              >
                {user?.fullName?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Box>
        </Box>

        <Popover
          open={isProfilePopoverOpen}
          anchorEl={profileAnchorEl}
          onClose={closeProfilePopover}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{
            sx: {
              mt: 0.8,
              p: 1.4,
              width: 260,
              borderRadius: 2,
              border: (t) => `1px solid ${alpha(t.palette.divider, 0.75)}`,
              boxShadow: (t) => `0 12px 28px ${alpha(t.palette.common.black, t.palette.mode === 'dark' ? 0.42 : 0.12)}`,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1, mb: 1.1 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#4F46E5', fontSize: '0.85rem' }}>
              {user?.fullName?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: 'text.primary' }} noWrap>
                {user?.fullName || 'Patient'}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }} noWrap>
                {user?.email || 'patient@health.app'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gap: 0.75 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Account status</Typography>
              <Chip
                size="small"
                label={accountStatusLabel}
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  bgcolor: alpha(statusColor, 0.12),
                  color: statusColor,
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Role</Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary' }}>
                {user?.role || 'Patient'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Patient ID</Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary' }}>
                {user?.id || user?._id || 'Not assigned'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Phone</Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary' }}>
                {user?.phone || user?.phoneNumber || 'Not provided'}
              </Typography>
            </Box>
          </Box>
        </Popover>

        <Box
          sx={{
            mb: 2.5,
            width: '100%',
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 2,
            alignItems: 'stretch',
          }}
        >
          {[
            {
              label: 'Condition Status',
              value: diseaseData?.disease || 'Not Set',
              helper: diseaseData?.lastUpdated ? `Updated ${formatDate(diseaseData.lastUpdated)}` : 'Start your assessment',
              icon: <FavoriteBorderIcon sx={{ fontSize: 18 }} />,
              color: '#6366F1',
              tint: alpha('#6366F1', 0.12),
            },
            {
              label: 'Progress',
              value: `${progress}%`,
              helper: progress === 100 ? 'Assessment complete' : 'Keep going',
              icon: <TrendingUpIcon sx={{ fontSize: 18 }} />,
              color: '#22C55E',
              tint: alpha('#22C55E', 0.12),
            },
            {
              label: 'Questions Completed',
              value: `${answeredQuestions}/${totalQuestions}`,
              helper: 'Answers saved',
              icon: <AssignmentTurnedInIcon sx={{ fontSize: 18 }} />,
              color: '#3B82F6',
              tint: alpha('#3B82F6', 0.12),
            },
            {
              label: 'Next Action',
              value: 'Assessment',
              helper: progress === 100 ? 'Open your report' : 'Finish onboarding',
              icon: <BoltIcon sx={{ fontSize: 18 }} />,
              color: '#F59E0B',
              tint: alpha('#F59E0B', 0.12),
            },
          ].map((item) => (
            <Box key={item.label} sx={{ display: 'flex', minWidth: 0 }}>
              <Paper
                elevation={0}
                onClick={item.label === 'Next Action' ? () => (progress === 100 ? navigate('/assessment') : navigate('/onboarding')) : undefined}
                sx={{
                  p: 2.25,
                  borderRadius: 2.5,
                  border: (t) => `1px solid ${alpha(t.palette.divider, 0.8)}`,
                  background: (t) => alpha(t.palette.background.paper, 0.92),
                  backdropFilter: 'blur(8px)',
                  height: '100%',
                  width: '100%',
                  minHeight: 156,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: item.label === 'Next Action' ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  boxShadow: (t) => `0 4px 12px ${alpha(t.palette.common.black, t.palette.mode === 'dark' ? 0.25 : 0.04)}`,
                  '&:hover': item.label === 'Next Action'
                    ? {
                        borderColor: alpha(item.color, 0.5),
                        boxShadow: `0 10px 20px ${alpha(item.color, 0.14)}`,
                        transform: 'translateY(-1px)',
                      }
                    : undefined,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      lineHeight: 1.2,
                      minHeight: 30,
                      display: 'flex',
                      alignItems: 'flex-start',
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Box
                    sx={{
                      color: item.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: item.tint,
                    }}
                  >
                    {item.icon}
                  </Box>
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    lineHeight: 1.2,
                    mb: 0.45,
                    fontSize: { xs: '1.2rem', md: '1.3rem' },
                    minHeight: 32,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {item.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 500,
                    fontSize: '0.82rem',
                    lineHeight: 1.35,
                    minHeight: 30,
                  }}
                >
                  {item.helper}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(0, 1fr)' },
            gap: 2,
            alignItems: 'stretch',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 3,
              border: (t) => `1px solid ${alpha('#6366F1', 0.18)}`,
              background: (t) =>
                `linear-gradient(135deg, ${alpha('#6366F1', t.palette.mode === 'dark' ? 0.2 : 0.1)} 0%, ${alpha(
                  '#3B82F6',
                  t.palette.mode === 'dark' ? 0.14 : 0.08
                )} 100%)`,
              minHeight: 250,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                  <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.08em' }}>
                    Continue Your Health Assessment
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', sm: '2rem' }, lineHeight: 1.15 }}>
                    Complete Your{' '}
                    <Box component="span" sx={{ color: '#4F46E5' }}>
                      Onboarding
                    </Box>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2, maxWidth: 420 }}>
                    Answer a few simple questions to help us understand your health better and provide personalized insights.
                  </Typography>
                  <Button
                    variant="contained"
                    endIcon={<ChevronRightIcon />}
                    onClick={() => navigate('/onboarding')}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 2.25,
                      py: 1.1,
                      background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                      boxShadow: '0 10px 20px rgba(99,102,241,0.28)',
                      '&:hover': { background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)' },
                    }}
                  >
                    Continue Assessment
                  </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'center' } }}>
                  <ProgressDonut value={progress} label="Complete" size={120} />
                </Box>
              </Grid>
            </Grid>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 3,
              border: (t) => `1px solid ${alpha(t.palette.divider, 0.8)}`,
              background: (t) => alpha(t.palette.background.paper, 0.92),
              minHeight: 250,
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>
                Recent Activity
              </Typography>
              <Button size="small" sx={{ textTransform: 'none', fontWeight: 700 }}>
                View all
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <ActivityTimeline items={activityItems} />
          </Paper>
        </Box>
      </Box>

      {/* Component 2: Lower 3 cards row (Health Insights / Risk Overview / Quick Actions) */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              minHeight: 230,
              border: (t) => `1px solid ${alpha(t.palette.divider, 0.7)}`,
              background: (t) => alpha(t.palette.background.paper, 0.92),
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>
                Health Insights
              </Typography>
              <Button size="small" sx={{ textTransform: 'none', fontWeight: 700 }}>
                View all
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ textAlign: 'center', pt: 1 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  mx: 'auto',
                  mb: 1.25,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha('#22C55E', 0.14),
                  color: '#16A34A',
                }}
              >
                <HealthAndSafetyIcon />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Start your journey
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                Complete the assessment to unlock personalized insights and recommendations.
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              minHeight: 230,
              border: (t) => `1px solid ${alpha(t.palette.divider, 0.7)}`,
              background: (t) => alpha(t.palette.background.paper, 0.92),
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', mb: 2 }}>
              Risk Overview
            </Typography>
            <Divider sx={{ mb: 2.25 }} />
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'center' }}>
                <Box
                  sx={{
                    width: 170,
                    height: 86,
                    borderTopLeftRadius: 170,
                    borderTopRightRadius: 170,
                    overflow: 'hidden',
                    position: 'relative',
                    background:
                      'conic-gradient(from 180deg at 50% 100%, #22C55E 0deg, #EAB308 90deg, #F97316 130deg, #EF4444 180deg, transparent 180deg)',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      bottom: -1,
                      transform: 'translateX(-50%)',
                      width: 112,
                      height: 58,
                      borderTopLeftRadius: 112,
                      borderTopRightRadius: 112,
                      bgcolor: (t) => t.palette.background.paper,
                    }}
                  />
                </Box>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Risk Level: {assessmentSummary ? `${assessmentSummary.risk_level}` : '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Complete your assessment to see your risk profile.
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              minHeight: 230,
              border: (t) => `1px solid ${alpha(t.palette.divider, 0.7)}`,
              background: (t) => alpha(t.palette.background.paper, 0.92),
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', mb: 2 }}>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Stack spacing={1.2}>
              {[
                { label: 'Start Assessment', desc: 'Begin your health check', icon: <AssignmentTurnedInIcon fontSize="small" />, action: () => navigate('/onboarding') },
                { label: 'Check My Risk', desc: 'Get your risk evaluation', icon: <BoltIcon fontSize="small" />, action: () => navigate('/assessment') },
                { label: 'Health Resources', desc: 'Learn more about diabetes', icon: <MenuBookIcon fontSize="small" />, action: () => navigate('/articles') },
              ].map((item) => (
                <Box
                  key={item.label}
                  onClick={item.action}
                  sx={{
                    p: 1.2,
                    borderRadius: 1.8,
                    border: (t) => `1px solid ${alpha(t.palette.divider, 0.7)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      borderColor: alpha('#6366F1', 0.45),
                      boxShadow: `0 8px 16px ${alpha('#6366F1', 0.1)}`,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: 1.4,
                        bgcolor: alpha('#6366F1', 0.12),
                        color: '#4F46E5',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                  <ArrowOutwardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default UndiagnosedInsightsView;
