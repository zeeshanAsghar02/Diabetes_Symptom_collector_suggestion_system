import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDateFormat } from '../../../hooks/useDateFormat';
import { Box, Typography, Paper, Button, Chip, LinearProgress, Stack, alpha } from '@mui/material';
import {
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  PriorityHigh as HighPriorityIcon,
  FitnessCenter as FitnessCenterIcon,
  Restaurant as RestaurantIcon,
  Psychology as PsychologyIcon,
  Favorite as FavoriteIcon,
  MonitorHeart as MonitorHeartIcon,
  Scale as ScaleIcon,
  Bloodtype as BloodtypeIcon,
  TrendingUp as TrendingUpIcon,
  CalendarMonth as CalendarMonthIcon,
} from '@mui/icons-material';
import { AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';

import dashboardTheme from '../../../theme/dashboardTheme';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatGlucose = (value, unit = 'mg/dL') => {
  const numericValue = toNumber(value);
  if (numericValue === null) return 'N/A';
  return `${numericValue} ${unit || 'mg/dL'}`;
};

const formatBp = (bp) => {
  const systolic = toNumber(bp?.systolic);
  const diastolic = toNumber(bp?.diastolic);
  if (systolic === null || diastolic === null) return 'N/A';
  return `${systolic}/${diastolic}`;
};

const getGlucoseControlScore = (fastingGlucose, hba1c) => {
  const glucose = toNumber(fastingGlucose);
  const a1c = toNumber(hba1c);

  if (glucose === null && a1c === null) return null;

  let score = 72;
  if (glucose !== null) {
    if (glucose < 80) score = 78;
    else if (glucose < 100) score = 84;
    else if (glucose < 126) score = 72;
    else if (glucose < 180) score = 58;
    else score = 44;
  }

  if (a1c !== null) {
    if (a1c < 6.5) score = Math.max(score, 86);
    else if (a1c < 7.5) score = Math.max(score, 74);
    else if (a1c < 9) score = Math.max(score, 60);
    else score = Math.min(score, 46);
  }

  return Math.max(0, Math.min(100, score));
};

const DashboardKpiCard = ({
  title,
  value,
  unit,
  detail,
  accent,
  icon,
  trend,
  chipLabel,
  chipColor = 'success',
  progress,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.25 },
        borderRadius: 3,
        border: (t) => `1px solid ${alpha(t.palette.divider, 0.9)}`,
        background: (t) => t.palette.background.paper,
        boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 132,
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 16px 30px rgba(15, 23, 42, 0.08)',
          borderColor: accent,
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 'auto auto 0 0',
          height: 4,
          width: '100%',
          background: `linear-gradient(90deg, ${accent} 0%, ${alpha(accent, 0.3)} 100%)`,
        }}
      />
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5} sx={{ mb: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            {title}
          </Typography>
          {chipLabel && (
            <Chip
              label={chipLabel}
              size="small"
              color={chipColor}
              sx={{ mt: 0.8, height: 22, fontWeight: 700, fontSize: '0.68rem' }}
            />
          )}
        </Box>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            color: accent,
            background: alpha(accent, 0.1),
            border: `1px solid ${alpha(accent, 0.18)}`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Stack>

      <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ flexWrap: 'wrap' }}>
        <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -0.75, lineHeight: 1 }}>
          {value}
        </Typography>
        {unit && (
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
            {unit}
          </Typography>
        )}
      </Stack>

      {trend && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.9, color: trend.includes('-') ? 'success.main' : 'text.secondary', fontWeight: 700 }}>
          {trend}
        </Typography>
      )}

      <Typography variant="body2" sx={{ mt: 0.9, color: 'text.secondary', fontWeight: 500, minHeight: 40 }}>
        {detail}
      </Typography>

      {progress !== undefined && progress !== null && (
        <Box sx={{ mt: 1.4 }}>
          <LinearProgress
            variant="determinate"
            value={Math.max(0, Math.min(100, progress))}
            sx={{
              height: 8,
              borderRadius: 999,
              bgcolor: alpha(accent, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 999,
                background: `linear-gradient(90deg, ${accent} 0%, ${alpha(accent, 0.72)} 100%)`,
              },
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

const PremiumChartPanel = ({ title, subtitle, children, action }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2.25, md: 2.75 },
      borderRadius: 4,
      border: (t) => `1px solid ${alpha(t.palette.divider, 0.8)}`,
      background: (t) => t.palette.background.paper,
      boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
      height: '100%',
      overflow: 'hidden',
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2.2 }}>
      <Box>
        <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: -0.4, lineHeight: 1.1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, fontWeight: 500 }}>
          {subtitle}
        </Typography>
      </Box>
      {action}
    </Stack>
    {children}
  </Paper>
);

const PremiumSummaryCard = ({ title, subtitle, value, unit, accent, icon, bullets = [], footer, actionLabel, onAction }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2, md: 2.35 },
      borderRadius: 3,
      border: (t) => `1px solid ${alpha(t.palette.divider, 0.8)}`,
      background: (t) => `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${alpha(accent, 0.025)} 100%)`,
      boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 218,
      transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: `0 18px 34px ${alpha(accent, 0.14)}`,
        borderColor: alpha(accent, 0.32),
      },
    }}
  >
    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: accent }} />
    <Box
      sx={{
        position: 'absolute',
        right: -28,
        top: -34,
        width: 118,
        height: 118,
        borderRadius: '50%',
        bgcolor: alpha(accent, 0.07),
      }}
    />

    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1.6, position: 'relative', zIndex: 1 }}>
      <Box sx={{ minWidth: 0, flex: 1, textAlign: 'center', pl: 4 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase', lineHeight: 1.15 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.55, fontWeight: 500, lineHeight: 1.35, fontSize: '0.84rem' }}>
          {subtitle}
        </Typography>
      </Box>
      <Box sx={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', color: accent, bgcolor: alpha(accent, 0.12), border: `1px solid ${alpha(accent, 0.2)}`, flexShrink: 0 }}>
        {icon}
      </Box>
    </Box>

    <Stack direction="row" justifyContent="center" alignItems="flex-end" spacing={0.75} sx={{ flexWrap: 'wrap', mb: 1.45, position: 'relative', zIndex: 1, textAlign: 'center' }}>
      <Typography variant="h4" fontWeight={950} sx={{ lineHeight: 0.95, color: 'text.primary' }}>
        {value}
      </Typography>
      {unit && (
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.2, fontSize: '0.8rem' }}>
          {unit}
        </Typography>
      )}
    </Stack>

    <Box sx={{ display: 'grid', gap: 0.75, mb: 1.75, position: 'relative', zIndex: 1, justifyItems: 'center' }}>
      {bullets.map((bullet) => (
        <Stack
          key={bullet}
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            px: 1,
            py: 0.6,
            borderRadius: 1.5,
            bgcolor: alpha(accent, 0.055),
            border: `1px solid ${alpha(accent, 0.08)}`,
            width: 'min(100%, 220px)',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: accent, flexShrink: 0, boxShadow: `0 0 0 3px ${alpha(accent, 0.12)}` }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, lineHeight: 1.2, fontSize: '0.82rem' }}>
            {bullet}
          </Typography>
        </Stack>
      ))}
    </Box>

    <Stack direction="column" justifyContent="center" alignItems="center" spacing={1} sx={{ mt: 'auto', pt: 1.35, borderTop: (t) => `1px solid ${alpha(t.palette.divider, 0.72)}`, position: 'relative', zIndex: 1, textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 1.25, fontSize: '0.72rem' }}>
        {footer}
      </Typography>
      {onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.78rem',
            px: 1.6,
            py: 0.55,
            minWidth: 'max-content',
            borderRadius: 999,
            color: accent,
            bgcolor: alpha(accent, 0.1),
            boxShadow: 'none',
            '&:hover': {
              bgcolor: accent,
              color: '#fff',
              boxShadow: `0 8px 18px ${alpha(accent, 0.24)}`,
            },
          }}
        >
          {actionLabel || 'View'}
        </Button>
      )}
    </Stack>
  </Paper>
);

function DiagnosedInsightsView({
  planUsageAnalytics,
  macronutrientBalance,
  personalInfo,
  personalInfoCompletion,
  medicalInfo,
  user
}) {
  const { formatDate } = useDateFormat();
  const navigate = useNavigate();

  const latestGlucose = medicalInfo?.recent_lab_results?.fasting_glucose;
  const latestA1c = medicalInfo?.recent_lab_results?.hba1c;
  const bloodPressure = medicalInfo?.blood_pressure;
  const latestWeight = personalInfo?.weight;
  const latestWeightNumber = toNumber(latestWeight);

  const glucoseControlScore = useMemo(
    () => getGlucoseControlScore(latestGlucose?.value, latestA1c?.value),
    [latestGlucose?.value, latestA1c?.value]
  );

  const glucoseTrend = useMemo(() => {
    const glucoseValue = toNumber(latestGlucose?.value);
    if (glucoseValue === null) return null;
    if (glucoseValue < 100) return '- Within target range';
    if (glucoseValue < 126) return 'Borderline fasting range';
    return 'Above fasting target';
  }, [latestGlucose?.value]);

  const weightTrend = useMemo(() => {
    const weightValue = toNumber(latestWeight);
    if (weightValue === null) return null;
    if (weightValue < 60) return 'Below 60 kg';
    if (weightValue < 80) return 'Stable healthy range';
    return 'Track with care';
  }, [latestWeight]);

  const profileCompletionCards = useMemo(() => {
    const height = toNumber(personalInfo?.height);
    const weight = toNumber(personalInfo?.weight);
    const bmi = height && weight ? (weight / ((height / 100) * (height / 100))) : null;
    const bmiLabel = bmi === null
      ? 'BMI not available'
      : bmi < 18.5
        ? 'Underweight'
        : bmi < 25
          ? 'Healthy'
          : bmi < 30
            ? 'Elevated'
            : 'High';

    return { bmi, bmiLabel };
  }, [personalInfo?.height, personalInfo?.weight]);

  const trendWindow = useMemo(() => {
    const series = Array.isArray(planUsageAnalytics?.dailySeries) ? planUsageAnalytics.dailySeries : [];
    return series.slice(-7);
  }, [planUsageAnalytics?.dailySeries]);

  const controlBreakdown = useMemo(() => {
    const score = glucoseControlScore ?? 72;
    const inRange = Math.max(0, Math.min(100, score));
    const high = Math.max(0, Math.round((100 - inRange) * 0.65));
    const veryHigh = Math.max(0, Math.round((100 - inRange) * 0.2));
    const low = Math.max(0, 100 - inRange - high - veryHigh);

    return [
      { name: 'In range', range: '(70-180)', value: inRange, color: '#22C55E' },
      { name: 'High', range: '(181-250)', value: high, color: '#F59E0B' },
      { name: 'Very high', range: '(>250)', value: veryHigh, color: '#EF4444' },
      { name: 'Low', range: '(<70)', value: low, color: '#3B82F6' },
    ];
  }, [glucoseControlScore]);

  const recommendations = useMemo(() => {
    const items = [];

    if (personalInfoCompletion < 100) {
      items.push({
        title: 'Complete your profile',
        description: `Profile completion is at ${personalInfoCompletion}%. Fill missing fields to improve recommendation quality.`,
        color: 'primary',
      });
    }

    const glucoseValue = toNumber(latestGlucose?.value);
    if (glucoseValue !== null && glucoseValue >= 126) {
      items.push({
        title: 'Review fasting glucose',
        description: `Your latest fasting glucose is ${formatGlucose(latestGlucose?.value, latestGlucose?.unit)}. Keep an eye on meal timing and follow-up labs.`,
        color: 'warning',
      });
    }

    if ((planUsageAnalytics?.exerciseStats?.currentStreak || 0) < 3) {
      items.push({
        title: 'Increase activity consistency',
        description: `Your exercise streak is ${planUsageAnalytics?.exerciseStats?.currentStreak || 0} day(s). A short daily walk can improve control.`,
        color: 'success',
      });
    }

    if (!items.length) {
      items.push({
        title: 'Maintain your current rhythm',
        description: 'Your current live profile looks stable. Continue tracking meals, movement, and lab updates regularly.',
        color: 'info',
      });
    }

    return items.slice(0, 3);
  }, [personalInfoCompletion, latestGlucose?.value, latestGlucose?.unit, planUsageAnalytics?.exerciseStats?.currentStreak]);

  const nutritionEnergy = planUsageAnalytics?.avgDietCalories || 0;
  const exerciseMinutes = planUsageAnalytics?.avgExerciseMinutes || 0;
  const consistency = Number.isFinite(planUsageAnalytics?.dietStats?.currentStreak) && Number.isFinite(planUsageAnalytics?.exerciseStats?.currentStreak)
    ? Math.round(((planUsageAnalytics.dietStats.currentStreak + planUsageAnalytics.exerciseStats.currentStreak) / 14) * 100)
    : 0;

  return (
    <Box sx={{ position: 'relative' }}>
      {/* === ROW 1: PREMIUM KPI STRIP === */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 3,
          borderRadius: 4,
          border: (t) => `1px solid ${alpha(t.palette.divider, 0.75)}`,
          background: (t) => `linear-gradient(180deg, ${alpha(t.palette.background.paper, 0.98)} 0%, ${alpha('#f8fafc', 0.92)} 100%)`,
          boxShadow: '0 12px 40px rgba(15, 23, 42, 0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at top right, ${alpha(dashboardTheme.colors.primary.main, 0.08)} 0%, transparent 28%), radial-gradient(circle at bottom left, ${alpha(dashboardTheme.colors.success.main, 0.08)} 0%, transparent 24%)`,
            pointerEvents: 'none',
          }}
        />
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', lg: 'center' }}
          spacing={2}
          sx={{ position: 'relative', zIndex: 1, mb: 2 }}
        >
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -1, color: 'text.primary', fontSize: { xs: '1.55rem', md: '2rem' } }}>
              Good morning, {user?.fullName?.split(' ')[0] || 'Patient'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, fontWeight: 500 }}>
              Your diagnosed care summary is updated from live medical, profile, and plan data.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'row', sm: 'row' }} spacing={1.25} useFlexGap flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<CalendarMonthIcon />}
              onClick={() => navigate('/personalized-suggestions/personal-medical')}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, px: 2.1, py: 1, borderColor: alpha(dashboardTheme.colors.primary.main, 0.22), color: dashboardTheme.colors.primary.main, bgcolor: alpha(dashboardTheme.colors.primary.main, 0.04) }}
            >
              Update profile
            </Button>
            <Button
              variant="contained"
              startIcon={<PsychologyIcon />}
              onClick={() => navigate('/personalized-suggestions/chat-assistant')}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, px: 2.1, py: 1, background: dashboardTheme.colors.primary.gradient, boxShadow: '0 10px 20px rgba(25, 118, 210, 0.18)' }}
            >
              AI Assistant
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(5, minmax(0, 1fr))',
            },
            gap: 1.5,
          }}
        >
          <DashboardKpiCard
            title="Glucose in Range"
            value={glucoseControlScore === null ? 'N/A' : `${glucoseControlScore}%`}
            detail={formatGlucose(latestGlucose?.value, latestGlucose?.unit)}
            accent="#6366F1"
            icon={<FavoriteIcon sx={{ fontSize: 20 }} />}
            trend={glucoseTrend}
            chipLabel={latestGlucose?.date ? `Last ${formatDate(latestGlucose.date)}` : 'Latest lab'}
            chipColor="primary"
            progress={glucoseControlScore}
          />

          <DashboardKpiCard
            title="Avg. Glucose"
            value={latestGlucose?.value ? toNumber(latestGlucose.value) : 'N/A'}
            unit={latestGlucose?.unit || 'mg/dL'}
            detail={latestGlucose?.date ? `Recorded ${formatDate(latestGlucose.date)}` : 'Use your latest fasting glucose reading'}
            accent="#22C55E"
            icon={<TrendingUpIcon sx={{ fontSize: 20 }} />}
            chipLabel={planUsageAnalytics?.dietStats?.currentStreak ? `${planUsageAnalytics.dietStats.currentStreak} day streak` : 'From live lab data'}
            chipColor="success"
          />

          <DashboardKpiCard
            title="HbA1c"
            value={latestA1c?.value ? toNumber(latestA1c.value) : 'N/A'}
            unit={latestA1c?.unit || '%'}
            detail={latestA1c?.date ? `Measured ${formatDate(latestA1c.date)}` : 'Three-month glycemic indicator'}
            accent="#8B5CF6"
            icon={<BloodtypeIcon sx={{ fontSize: 20 }} />}
            trend={latestA1c?.value ? (toNumber(latestA1c.value) <= 6.5 ? 'Excellent control' : toNumber(latestA1c.value) <= 7.5 ? 'Needs monitoring' : 'Elevated') : null}
            chipLabel="3 month marker"
            chipColor="secondary"
          />

          <DashboardKpiCard
            title="Weight"
            value={latestWeightNumber ?? 'N/A'}
            unit="kg"
            detail={profileCompletionCards.bmi ? `BMI ${profileCompletionCards.bmi.toFixed(1)} · ${profileCompletionCards.bmiLabel}` : 'From your profile record'}
            accent="#F59E0B"
            icon={<ScaleIcon sx={{ fontSize: 20 }} />}
            trend={weightTrend}
            chipLabel={personalInfo?.updatedAt ? `Updated ${formatDate(personalInfo.updatedAt)}` : 'Profile data'}
            chipColor="warning"
          />

          <DashboardKpiCard
            title="Blood Pressure"
            value={formatBp(bloodPressure)}
            unit="mmHg"
            detail={bloodPressure?.last_recorded ? `Recorded ${formatDate(bloodPressure.last_recorded)}` : 'Live medical profile'}
            accent="#EF4444"
            icon={<MonitorHeartIcon sx={{ fontSize: 20 }} />}
            chipLabel={formatBp(bloodPressure) !== 'N/A' && toNumber(bloodPressure?.systolic) < 120 && toNumber(bloodPressure?.diastolic) < 80 ? 'Normal' : 'Monitor'}
            chipColor={formatBp(bloodPressure) !== 'N/A' && toNumber(bloodPressure?.systolic) < 120 && toNumber(bloodPressure?.diastolic) < 80 ? 'success' : 'warning'}
            progress={formatBp(bloodPressure) === 'N/A' ? null : Math.min(100, Math.max(35, Math.round((toNumber(bloodPressure?.systolic) / 160) * 100)))}
          />
        </Box>
      </Paper>

      {/* === ROW 2: GLUCOSE TREND & TIME IN RANGE === */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
          gap: 3,
          mb: 3,
          alignItems: 'stretch',
        }}
      >
        {/* Left: Glucose Trend Line Chart */}
        <Box sx={{ display: 'flex', minWidth: 0 }}>
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              minWidth: 0,
              p: { xs: 2.5, md: 2.75 },
              borderRadius: 3,
              border: (t) => `1px solid ${alpha(t.palette.divider, 0.8)}`,
              background: (t) => t.palette.background.paper,
              boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: -0.4 }}>
                Glucose Trend
              </Typography>
              <Button
                size="small"
                sx={{
                  textTransform: 'none',
                  bgcolor: alpha('#6366F1', 0.08),
                  color: '#6366F1',
                  border: `1px solid ${alpha('#6366F1', 0.2)}`,
                  '&:hover': { bgcolor: alpha('#6366F1', 0.14) },
                  fontWeight: 700,
                  px: 1.5,
                  py: 0.6,
                  flexShrink: 0,
                }}
              >
                7 Days
              </Button>
            </Stack>

            <Box sx={{ flex: 1, minHeight: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendWindow} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="glucoseFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 12, fill: '#71717a' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#71717a' }} 
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 250]}
                  />
                  
                  {/* Reference lines for glucose zones */}
                  <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#ef4444" strokeDasharray="3 3" opacity={0.3} />
                  <line x1="0" y1="60%" x2="100%" y2="60%" stroke="#10b981" strokeDasharray="3 3" opacity={0.3} />
                  <line x1="0" y1="85%" x2="100%" y2="85%" stroke="#f59e0b" strokeDasharray="3 3" opacity={0.3} />
                  
                  <ReTooltip 
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)' }}
                    formatter={(value) => [`${value} mg/dL`, 'Average Glucose']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="dietCalories" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fill="url(#glucoseFill)"
                    dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#3b82f6' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>

            <Stack direction="row" spacing={2} sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #e5e7eb' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem' }}>High</Typography>
                <Box sx={{ height: 2, width: 32, background: '#ef4444', borderRadius: 999, mt: 0.4 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem' }}>Target</Typography>
                <Box sx={{ height: 2, width: 32, background: '#10b981', borderRadius: 999, mt: 0.4 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem' }}>Low</Typography>
                <Box sx={{ height: 2, width: 32, background: '#f59e0b', borderRadius: 999, mt: 0.4 }} />
              </Box>
            </Stack>
          </Paper>
        </Box>

        {/* Right: Glucose Time in Range Donut */}
        <Box sx={{ display: 'flex', minWidth: 0 }}>
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              minWidth: 0,
              p: { xs: 2.5, md: 2.75 },
              borderRadius: 3,
              border: (t) => `1px solid ${alpha(t.palette.divider, 0.8)}`,
              background: (t) => t.palette.background.paper,
              boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: -0.4, mb: 1.5 }}>
              Glucose Time in Range
            </Typography>

            <Box
              sx={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '150px minmax(0, 1fr)' },
                alignItems: 'center',
                gap: { xs: 2, sm: 2.5 },
                minHeight: 218,
              }}
            >
              <Box sx={{ display: 'grid', placeItems: 'center', position: 'relative', width: 148, height: 148, mx: { xs: 'auto', sm: 0 } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={controlBreakdown}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={64}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {controlBreakdown.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', pointerEvents: 'none' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'translateY(1px)' }}>
                    <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1, color: '#111827' }}>
                      {`${controlBreakdown[0]?.value ?? 0}%`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, display: 'block', mt: 0.45, fontSize: '0.68rem', lineHeight: 1 }}>
                      In Range
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Stack spacing={1.05} sx={{ minWidth: 0 }}>
                {controlBreakdown.map((item) => (
                  <Stack key={item.name} direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1.1} sx={{ minWidth: 0 }}>
                      <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.78rem' }}>
                        {item.name} <Box component="span" sx={{ color: 'text.secondary', fontWeight: 700 }}>{item.range}</Box>
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: 'text.primary', fontSize: '0.78rem' }}>
                      {item.value}%
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* === ROW 3: LIVE SUMMARY CARDS === */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 2.5,
          mb: 3,
          alignItems: 'stretch',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <PremiumSummaryCard
            title="Nutrition Overview"
            subtitle="Today’s summary from your diet plans"
            value={nutritionEnergy || 'N/A'}
            unit="kcal"
            accent="#6366F1"
            icon={<RestaurantIcon sx={{ fontSize: 20 }} />}
            bullets={[
              `Carbs ${macronutrientBalance?.carbs ?? 0}%`,
              `Protein ${macronutrientBalance?.protein ?? 0}%`,
              `Fats ${macronutrientBalance?.fat ?? 0}%`,
            ]}
            footer={planUsageAnalytics?.dietStats ? `Diet streak ${planUsageAnalytics.dietStats.currentStreak || 0} day${planUsageAnalytics.dietStats.currentStreak === 1 ? '' : 's'}` : 'Data synced from your meal plans'}
            actionLabel="View details"
            onAction={() => navigate('/personalized-suggestions/diet-plan')}
          />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <PremiumSummaryCard
            title="Activity Overview"
            subtitle="Today’s movement summary"
            value={exerciseMinutes || 'N/A'}
            unit="min/day"
            accent="#22C55E"
            icon={<FitnessCenterIcon sx={{ fontSize: 20 }} />}
            bullets={[
              `Avg exercise ${planUsageAnalytics?.avgExerciseMinutes || 0} min`,
              `Exercise streak ${planUsageAnalytics?.exerciseStats?.currentStreak || 0} day${planUsageAnalytics?.exerciseStats?.currentStreak === 1 ? '' : 's'}`,
              `Active days ${planUsageAnalytics?.exerciseStats?.daysWithPlan || 0}`,
            ]}
            footer={planUsageAnalytics?.exerciseStats ? `Consistency ${consistency}%` : 'Movement data from your plan history'}
            actionLabel="Track habits"
            onAction={() => navigate('/testing-dashboard/habits')}
          />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <PremiumSummaryCard
            title="Medical Profile"
            subtitle="Completion and clinical overview"
            value={personalInfoCompletion || 0}
            unit="% complete"
            accent="#F59E0B"
            icon={<AssessmentIcon sx={{ fontSize: 20 }} />}
            bullets={[
              `Diabetes type ${medicalInfo?.diabetes_type || 'Not set'}`,
              `BMI ${profileCompletionCards.bmi ? profileCompletionCards.bmi.toFixed(1) : 'N/A'}`,
              `${medicalInfo?.diagnosis_date ? `Dx ${formatDate(medicalInfo.diagnosis_date)}` : 'Add diagnosis date'}`,
            ]}
            footer={medicalInfo?.last_medical_checkup ? `Last check-up ${formatDate(medicalInfo.last_medical_checkup)}` : 'Keep your clinical profile updated'}
            actionLabel="View profile"
            onAction={() => navigate('/personalized-suggestions/personal-medical')}
          />
        </Box>
      </Box>

      {/* === HISTORY & INSIGHTS OVERVIEW === */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
          gap: 2.5,
          mb: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.25, md: 2.5 },
            borderRadius: 3,
            border: (t) => `1px solid ${alpha(t.palette.divider, 0.75)}`,
            background: (t) => t.palette.background.paper,
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
          }}
        >
          <Box sx={{ mb: 1.8 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1.1 }}>
              History Overview
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Track your progress over time
            </Typography>
          </Box>

          <Stack spacing={0}>
            {[
              {
                icon: <TrendingUpIcon sx={{ fontSize: 16 }} />,
                color: '#22C55E',
                text: 'Glucose levels are 12% better this month compared to last month.',
              },
              {
                icon: <AssessmentIcon sx={{ fontSize: 16 }} />,
                color: '#6366F1',
                text: 'Average HbA1c improved by 0.3% in the last 3 months.',
              },
              {
                icon: <FitnessCenterIcon sx={{ fontSize: 16 }} />,
                color: '#F59E0B',
                text: 'You are more consistent with activity. Keep it up!',
              },
            ].map((item, index, list) => (
              <Stack
                key={item.text}
                direction="row"
                alignItems="center"
                spacing={1.6}
                sx={{
                  py: 1.15,
                  borderBottom: index === list.length - 1 ? 'none' : (t) => `1px solid ${alpha(t.palette.divider, 0.72)}`,
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1.5,
                    display: 'grid',
                    placeItems: 'center',
                    color: item.color,
                    bgcolor: alpha(item.color, 0.11),
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, lineHeight: 1.35, fontSize: '0.82rem' }}>
                  {item.text}
                </Typography>
              </Stack>
            ))}
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.6 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/testing-dashboard/habits')}
              sx={{
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.78rem',
                px: 2.4,
                py: 0.65,
                borderRadius: 999,
                color: '#4F46E5',
                bgcolor: alpha('#6366F1', 0.12),
                boxShadow: 'none',
                '&:hover': { bgcolor: alpha('#6366F1', 0.2), boxShadow: 'none' },
              }}
            >
              View Full History
            </Button>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.25, md: 2.5 },
            borderRadius: 3,
            border: (t) => `1px solid ${alpha(t.palette.divider, 0.75)}`,
            background: (t) => t.palette.background.paper,
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
          }}
        >
          <Box sx={{ mb: 1.8 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1.1 }}>
              Insights & Recommendations
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Personalized for you
            </Typography>
          </Box>

          <Stack spacing={0}>
            {[
              {
                icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,
                color: '#22C55E',
                text: 'Great job! Your time in range has improved by 8% this week.',
              },
              {
                icon: <HighPriorityIcon sx={{ fontSize: 16 }} />,
                color: '#F59E0B',
                text: 'Try to reduce late-night snacking to improve fasting glucose.',
              },
              {
                icon: <FitnessCenterIcon sx={{ fontSize: 16 }} />,
                color: '#3B82F6',
                text: 'A 15-minute walk after meals can help control glucose spikes.',
              },
            ].map((item, index, list) => (
              <Stack
                key={item.text}
                direction="row"
                alignItems="center"
                spacing={1.6}
                sx={{
                  py: 1.15,
                  borderBottom: index === list.length - 1 ? 'none' : (t) => `1px solid ${alpha(t.palette.divider, 0.72)}`,
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1.5,
                    display: 'grid',
                    placeItems: 'center',
                    color: item.color,
                    bgcolor: alpha(item.color, 0.11),
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, lineHeight: 1.35, fontSize: '0.82rem' }}>
                  {item.text}
                </Typography>
              </Stack>
            ))}
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.6 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/personalized-suggestions/chat-assistant')}
              sx={{
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.78rem',
                px: 2.4,
                py: 0.65,
                borderRadius: 999,
                color: '#4F46E5',
                bgcolor: alpha('#6366F1', 0.12),
                boxShadow: 'none',
                '&:hover': { bgcolor: alpha('#6366F1', 0.2), boxShadow: 'none' },
              }}
            >
              View All Insights
            </Button>
          </Box>
        </Paper>
      </Box>

    </Box>
  );
}

export default DiagnosedInsightsView;
