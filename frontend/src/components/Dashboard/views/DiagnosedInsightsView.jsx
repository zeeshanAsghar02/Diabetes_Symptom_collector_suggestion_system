import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  AutoAwesome as AutoAwesomeIcon,
  CheckCircle as CheckCircleIcon,
  FitnessCenter as FitnessCenterIcon,
  LocalDining as LocalDiningIcon,
  MedicalInformation as MedicalInformationIcon,
  Psychology as PsychologyIcon,
  TipsAndUpdates as TipsAndUpdatesIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';

const surfaceSx = {
  borderRadius: 3,
  border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.72)}`,
  background: (theme) => theme.palette.background.paper,
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
};

const getFirstName = (user) => {
  const name = user?.full_name || user?.name || user?.email || 'there';
  return String(name).split(' ')[0];
};

const formatLabValue = (value, unit = '') => {
  if (value === null || value === undefined || value === '') return 'Not entered';
  return `${value}${unit ? ` ${unit}` : ''}`;
};

const getLabStatus = (type, value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return { label: 'Missing', color: 'default' };
  if (type === 'hba1c') {
    if (numeric < 7) return { label: 'In target', color: 'success' };
    if (numeric < 8.5) return { label: 'Review', color: 'warning' };
    return { label: 'Needs care', color: 'error' };
  }
  if (type === 'glucose') {
    if (numeric >= 80 && numeric <= 130) return { label: 'In range', color: 'success' };
    if (numeric < 80 || numeric <= 180) return { label: 'Review', color: 'warning' };
    return { label: 'Needs care', color: 'error' };
  }
  return { label: 'Entered', color: 'info' };
};

const getProfileChecklist = (personalInfo, medicalInfo) => [
  { label: 'Personal details', complete: Boolean(personalInfo?.gender && personalInfo?.date_of_birth) },
  { label: 'Body measurements', complete: Boolean(personalInfo?.height && personalInfo?.weight) },
  { label: 'Activity & diet preference', complete: Boolean(personalInfo?.activity_level && personalInfo?.dietary_preference) },
  { label: 'Diabetes type', complete: Boolean(medicalInfo?.diabetes_type) },
  { label: 'Lab values', complete: Boolean(medicalInfo?.recent_lab_results?.hba1c?.value || medicalInfo?.recent_lab_results?.fasting_glucose?.value) },
  { label: 'Blood pressure', complete: Boolean(medicalInfo?.blood_pressure?.systolic && medicalInfo?.blood_pressure?.diastolic) },
];

const PremiumActionCard = ({
  title,
  description,
  status,
  statusColor = 'default',
  icon,
  accent,
  actionLabel,
  onAction,
  disabled = false,
  helper,
}) => (
  <Paper
    elevation={0}
    sx={{
      ...surfaceSx,
      p: { xs: 2.25, md: 2.5 },
      minHeight: 238,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
      opacity: disabled ? 0.78 : 1,
      '&:hover': {
        transform: disabled ? 'none' : 'translateY(-3px)',
        boxShadow: disabled ? '0 10px 30px rgba(15, 23, 42, 0.06)' : `0 18px 38px ${alpha(accent, 0.16)}`,
        borderColor: alpha(accent, 0.32),
      },
    }}
  >
    <Box sx={{ position: 'absolute', inset: '0 0 auto 0', height: 4, bgcolor: accent }} />
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          color: accent,
          bgcolor: alpha(accent, 0.1),
          border: `1px solid ${alpha(accent, 0.18)}`,
        }}
      >
        {icon}
      </Box>
      <Chip label={status} color={statusColor} size="small" sx={{ fontWeight: 700 }} />
    </Stack>
    <Typography variant="h6" fontWeight={850} sx={{ color: '#0f172a', lineHeight: 1.18, mb: 1 }}>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.65, mb: 1.25 }}>
      {description}
    </Typography>
    {helper && (
      <Typography variant="caption" sx={{ color: disabled ? '#b45309' : '#475569', fontWeight: 650, mt: 'auto', mb: 1.5 }}>
        {helper}
      </Typography>
    )}
    {!helper && <Box sx={{ flexGrow: 1 }} />}
    <Button
      fullWidth
      variant={disabled ? 'outlined' : 'contained'}
      endIcon={<ArrowForwardIcon />}
      onClick={onAction}
      sx={{
        mt: 'auto',
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 800,
        py: 1.1,
        boxShadow: disabled ? 'none' : `0 8px 20px ${alpha(accent, 0.22)}`,
        bgcolor: disabled ? 'transparent' : accent,
        borderColor: disabled ? alpha(accent, 0.35) : 'transparent',
        color: disabled ? accent : '#fff',
        '&:hover': {
          bgcolor: disabled ? alpha(accent, 0.08) : accent,
          boxShadow: disabled ? 'none' : `0 12px 28px ${alpha(accent, 0.28)}`,
        },
      }}
    >
      {actionLabel}
    </Button>
  </Paper>
);

const HealthMetricCard = ({ label, value, detail, status, statusColor = 'default' }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 2.5,
      border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.72)}`,
      bgcolor: '#fff',
      minHeight: 116,
    }}
  >
    <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </Typography>
      <Chip label={status} color={statusColor} size="small" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 750 }} />
    </Stack>
    <Typography variant="h5" fontWeight={900} sx={{ color: '#0f172a', lineHeight: 1.15 }}>
      {value}
    </Typography>
    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.8 }}>
      {detail}
    </Typography>
  </Paper>
);

function DiagnosedInsightsView({
  bmiAnalytics,
  personalInfo,
  personalInfoCompletion,
  medicalInfo,
  user,
  onOpenTool,
  onSwitchSection,
  dietHistory = [],
  exerciseHistory = [],
  lifestyleHistory = [],
}) {
  const isProfileComplete = personalInfoCompletion >= 100;
  const checklist = useMemo(() => getProfileChecklist(personalInfo, medicalInfo), [personalInfo, medicalInfo]);
  const missingItems = checklist.filter((item) => !item.complete);
  const hba1cStatus = getLabStatus('hba1c', medicalInfo?.recent_lab_results?.hba1c?.value);
  const glucoseStatus = getLabStatus('glucose', medicalInfo?.recent_lab_results?.fasting_glucose?.value);
  const bpEntered = Boolean(medicalInfo?.blood_pressure?.systolic && medicalInfo?.blood_pressure?.diastolic);

  const nextAction = isProfileComplete
    ? {
        title: dietHistory.length > 0 ? 'Review your care plan' : 'Generate your first diet plan',
        body: dietHistory.length > 0
          ? 'Your profile is ready. Continue with your nutrition, exercise, and lifestyle tools.'
          : 'Your profile is complete. Start with a personalized diet plan to unlock nutrition insights.',
        label: dietHistory.length > 0 ? 'Open Care Plan' : 'Open Diet Plan',
        action: () => (dietHistory.length > 0 ? onSwitchSection?.('Care Plan') : onOpenTool?.('diet-plan')),
      }
    : {
        title: 'Complete your health profile',
        body: `${missingItems.length} profile item${missingItems.length === 1 ? '' : 's'} still need attention before the full AI care tools unlock.`,
        label: 'Complete Profile',
        action: () => onOpenTool?.('personal-medical'),
      };

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Paper
        elevation={0}
        sx={{
          ...surfaceSx,
          p: { xs: 2.5, md: 3.5 },
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 48%, #f1fdf8 100%)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', right: -90, top: -100, width: 240, height: 240, borderRadius: '50%', bgcolor: alpha('#0ea5e9', 0.08) }} />
        <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
              <Chip label={medicalInfo?.diabetes_type || 'Diagnosed care'} color="primary" size="small" sx={{ fontWeight: 800 }} />
              <Chip label="Latest values are manually entered" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
            </Stack>
            <Typography variant="h4" fontWeight={950} sx={{ color: '#0f172a', letterSpacing: 0, lineHeight: 1.12, mb: 1 }}>
              Good to see you, {getFirstName(user)}
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 680, lineHeight: 1.75 }}>
              Your Diavise care environment brings profile setup, nutrition, exercise, lifestyle guidance, and AI support into one calm workspace.
            </Typography>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: '#fff', border: `1px solid ${alpha('#0f172a', 0.08)}` }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={850} sx={{ color: '#0f172a' }}>
                  Profile readiness
                </Typography>
                <Typography variant="h5" fontWeight={950} sx={{ color: isProfileComplete ? '#059669' : '#2563eb' }}>
                  {personalInfoCompletion}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={personalInfoCompletion}
                sx={{
                  height: 9,
                  borderRadius: 999,
                  bgcolor: alpha('#94a3b8', 0.18),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 999,
                    background: isProfileComplete
                      ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(90deg, #2563eb 0%, #06b6d4 100%)',
                  },
                }}
              />
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mt: 1.5 }}>
                {isProfileComplete ? 'Your care tools are ready.' : `${missingItems.length} setup item${missingItems.length === 1 ? '' : 's'} remaining.`}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} lg={2.4}>
          <PremiumActionCard
            title="Personal & Medical Info"
            description="Keep your body metrics, diabetes details, medications, and lab values current."
            status={isProfileComplete ? 'Complete' : `${personalInfoCompletion}% complete`}
            statusColor={isProfileComplete ? 'success' : 'info'}
            icon={<MedicalInformationIcon />}
            accent="#2563eb"
            actionLabel={isProfileComplete ? 'Update Profile' : 'Complete Profile'}
            onAction={() => onOpenTool?.('personal-medical')}
            helper={missingItems[0] ? `Next: ${missingItems[0].label}` : 'All required profile areas are ready.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={2.4}>
          <PremiumActionCard
            title="Diet Plan"
            description="Generate diabetic-friendly daily and monthly meal options from your profile."
            status={isProfileComplete ? (dietHistory.length ? 'Active' : 'Ready') : 'Needs profile'}
            statusColor={isProfileComplete ? 'success' : 'warning'}
            icon={<LocalDiningIcon />}
            accent="#059669"
            actionLabel={isProfileComplete ? 'Open Diet Plan' : 'View Requirements'}
            onAction={() => isProfileComplete ? onOpenTool?.('diet-plan') : onOpenTool?.('personal-medical')}
            disabled={!isProfileComplete}
            helper={isProfileComplete ? `${dietHistory.length || 0} diet record${dietHistory.length === 1 ? '' : 's'} found.` : 'Complete your health profile first.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={2.4}>
          <PremiumActionCard
            title="Exercise Plan"
            description="Create activity guidance matched to your age, profile, and diabetes care needs."
            status={isProfileComplete ? (exerciseHistory.length ? 'Active' : 'Ready') : 'Needs profile'}
            statusColor={isProfileComplete ? 'success' : 'warning'}
            icon={<FitnessCenterIcon />}
            accent="#0ea5e9"
            actionLabel={isProfileComplete ? 'Open Exercise Plan' : 'View Requirements'}
            onAction={() => isProfileComplete ? onOpenTool?.('exercise-plan') : onOpenTool?.('personal-medical')}
            disabled={!isProfileComplete}
            helper={isProfileComplete ? `${exerciseHistory.length || 0} exercise record${exerciseHistory.length === 1 ? '' : 's'} found.` : 'Profile data keeps exercise guidance safer.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={2.4}>
          <PremiumActionCard
            title="Lifestyle Tips"
            description="Review practical habits for meals, sleep, hydration, movement, and routine."
            status={isProfileComplete ? (lifestyleHistory.length ? 'Available' : 'Ready') : 'Needs profile'}
            statusColor={isProfileComplete ? 'success' : 'warning'}
            icon={<TipsAndUpdatesIcon />}
            accent="#f59e0b"
            actionLabel={isProfileComplete ? 'View Tips' : 'View Requirements'}
            onAction={() => isProfileComplete ? onOpenTool?.('lifestyle-tips') : onOpenTool?.('personal-medical')}
            disabled={!isProfileComplete}
            helper={isProfileComplete ? 'Lifestyle guidance is ready to review.' : 'Complete setup to personalize tips.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={2.4}>
          <PremiumActionCard
            title="AI Assistant"
            description="Ask educational diabetes questions and get profile-aware suggestions."
            status={isProfileComplete ? 'Unlocked' : 'Needs profile'}
            statusColor={isProfileComplete ? 'success' : 'warning'}
            icon={<PsychologyIcon />}
            accent="#7c3aed"
            actionLabel={isProfileComplete ? 'Ask AI' : 'Complete Profile'}
            onAction={() => isProfileComplete ? onSwitchSection?.('AI Assistant') : onOpenTool?.('personal-medical')}
            disabled={!isProfileComplete}
            helper="Educational support only, not a diagnosis."
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ ...surfaceSx, p: { xs: 2.25, md: 2.75 } }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2.5 }}>
              <Box>
                <Typography variant="h6" fontWeight={900} sx={{ color: '#0f172a' }}>
                  Latest Health Snapshot
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                  These values come from your latest entered medical and profile records.
                </Typography>
              </Box>
              <Button variant="outlined" onClick={() => onSwitchSection?.('Care Plan')} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800 }}>
                View Care Plan
              </Button>
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <HealthMetricCard
                  label="BMI"
                  value={bmiAnalytics?.value || 'Not entered'}
                  detail={bmiAnalytics ? 'Calculated from height and weight' : 'Add height and weight'}
                  status={bmiAnalytics?.label || 'Missing'}
                  statusColor={bmiAnalytics?.severity || 'default'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <HealthMetricCard
                  label="HbA1c"
                  value={formatLabValue(medicalInfo?.recent_lab_results?.hba1c?.value, medicalInfo?.recent_lab_results?.hba1c?.unit || '%')}
                  detail="Latest entered lab value"
                  status={hba1cStatus.label}
                  statusColor={hba1cStatus.color}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <HealthMetricCard
                  label="Fasting Glucose"
                  value={formatLabValue(medicalInfo?.recent_lab_results?.fasting_glucose?.value, medicalInfo?.recent_lab_results?.fasting_glucose?.unit || 'mg/dL')}
                  detail="Latest entered lab value"
                  status={glucoseStatus.label}
                  statusColor={glucoseStatus.color}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <HealthMetricCard
                  label="Blood Pressure"
                  value={bpEntered ? `${medicalInfo.blood_pressure.systolic}/${medicalInfo.blood_pressure.diastolic}` : 'Not entered'}
                  detail="Manual medical record"
                  status={bpEntered ? 'Entered' : 'Missing'}
                  statusColor={bpEntered ? 'info' : 'default'}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ ...surfaceSx, p: { xs: 2.25, md: 2.75 }, height: '100%' }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
              {isProfileComplete ? <AutoAwesomeIcon sx={{ color: '#059669' }} /> : <WarningAmberIcon sx={{ color: '#f59e0b' }} />}
              <Typography variant="h6" fontWeight={900} sx={{ color: '#0f172a' }}>
                Today&apos;s Focus
              </Typography>
            </Stack>
            <Typography variant="subtitle1" fontWeight={850} sx={{ color: '#0f172a', mb: 0.75 }}>
              {nextAction.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.7, mb: 2.25 }}>
              {nextAction.body}
            </Typography>
            {!isProfileComplete && (
              <Stack spacing={1} sx={{ mb: 2 }}>
                {missingItems.slice(0, 4).map((item) => (
                  <Stack key={item.label} direction="row" spacing={1} alignItems="center">
                    <WarningAmberIcon sx={{ fontSize: 17, color: '#f59e0b' }} />
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>
                      {item.label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
            <Button
              fullWidth
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={nextAction.action}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 850,
                py: 1.15,
                bgcolor: isProfileComplete ? '#059669' : '#2563eb',
                '&:hover': { bgcolor: isProfileComplete ? '#047857' : '#1d4ed8' },
              }}
            >
              {nextAction.label}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DiagnosedInsightsView;
