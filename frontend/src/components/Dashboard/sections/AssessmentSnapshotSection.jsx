import React, { useMemo } from 'react';
import { Box, Button, Chip, CircularProgress, Paper, Stack, Typography, alpha } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import OpacityIcon from '@mui/icons-material/Opacity';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useNavigate } from 'react-router-dom';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getRiskLabel = (value) => {
  const normalized = String(value || 'low').toLowerCase();
  if (normalized === 'high') return 'High';
  if (normalized === 'medium') return 'Moderate';
  return 'Low';
};

const getFastingLabel = (value) => {
  if (value == null) return { label: 'No data', color: '#64748B' };
  if (value < 100) return { label: 'Normal', color: '#16A34A' };
  if (value < 126) return { label: 'Elevated', color: '#F59E0B' };
  return { label: 'High', color: '#EF4444' };
};

const getBmiLabel = (bmi) => {
  if (bmi == null) return { label: 'No data', color: '#64748B', range: 'Ideal range: 18.5 - 24.9' };
  if (bmi < 18.5) return { label: 'Underweight', color: '#F59E0B', range: 'Ideal range: 18.5 - 24.9' };
  if (bmi < 25) return { label: 'Normal', color: '#16A34A', range: 'Ideal range: 18.5 - 24.9' };
  if (bmi < 30) return { label: 'Overweight', color: '#F97316', range: 'Ideal range: 18.5 - 24.9' };
  return { label: 'Obese', color: '#EF4444', range: 'Ideal range: 18.5 - 24.9' };
};

const getActivityLabel = (activityLevel) => {
  const normalized = String(activityLevel || '').toLowerCase();
  if (!normalized) return { label: 'Not set', color: '#64748B', helper: 'Add activity details' };
  if (normalized.includes('sedentary')) return { label: 'Low', color: '#EF4444', helper: 'Try to move more!' };
  if (normalized.includes('lightly')) return { label: 'Light', color: '#F59E0B', helper: 'Keep building momentum' };
  if (normalized.includes('moderately')) return { label: 'Moderate', color: '#16A34A', helper: 'Solid routine' };
  if (normalized.includes('very') || normalized.includes('extremely')) return { label: 'High', color: '#0EA5E9', helper: 'Excellent activity level' };
  return { label: activityLevel, color: '#64748B', helper: 'Current activity level' };
};

const buildSparklinePath = (values, width = 110, height = 40) => {
  if (!values.length) return '';

  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = index * stepX;
      const normalized = (value - min) / spread;
      const y = height - normalized * (height - 4) - 2;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
};

function MetricCard({ title, value, helper, accent, children, subtitle, chipLabel, chipColor, minHeight = 168 }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.2,
        borderRadius: 3,
        minHeight,
        border: (t) => `1px solid ${alpha(accent, 0.2)}`,
        background: (t) => alpha(t.palette.background.paper, 0.95),
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.25, mb: 1.2 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.06em', color: 'text.secondary', textTransform: 'uppercase' }}>
            {title}
          </Typography>
          <Box sx={{ width: 34, height: 34, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(accent, 0.12), color: accent }}>
            {children}
          </Box>
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.05, color: accent, mb: 0.45 }}>
          {value}
        </Typography>
        {chipLabel ? (
          <Chip
            label={chipLabel}
            size="small"
            sx={{
              fontWeight: 800,
              height: 24,
              mb: 1,
              bgcolor: alpha(chipColor || accent, 0.12),
              color: chipColor || accent,
              border: `1px solid ${alpha(chipColor || accent, 0.2)}`,
            }}
          />
        ) : null}
        {subtitle ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.45 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {helper ? (
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1.25, display: 'block' }}>
          {helper}
        </Typography>
      ) : null}
    </Paper>
  );
}

function GaugeCard({ score, label }) {
  const value = Math.max(0, Math.min(100, score));
  const angle = -120 + (value / 100) * 240;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
      <Box sx={{ position: 'relative', width: 140, height: 92, overflow: 'hidden', mb: 0.75 }}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '140px 140px 0 0',
            background: 'conic-gradient(from 180deg, #F97316 0deg, #F59E0B 80deg, #22C55E 180deg, #4F46E5 240deg, #E2E8F0 240deg)',
            mask: 'radial-gradient(circle at 50% 100%, transparent 0 47px, #000 48px)',
            WebkitMask: 'radial-gradient(circle at 50% 100%, transparent 0 47px, #000 48px)',
            opacity: 0.9,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: 10,
            width: 3,
            height: 50,
            bgcolor: '#1F2937',
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${angle}deg)`,
            borderRadius: 99,
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: 6,
            width: 16,
            height: 16,
            borderRadius: '50%',
            bgcolor: '#1F2937',
            transform: 'translateX(-50%)',
            border: '3px solid #fff',
          }}
        />
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1 }}>
        {value}/100
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.35 }}>
        Risk Score
      </Typography>
      <Chip label={label} size="small" sx={{ mt: 1, fontWeight: 800, bgcolor: alpha('#4F46E5', 0.1), color: '#4F46E5' }} />
    </Box>
  );
}

function RingScore({ score, label }) {
  const value = Math.max(0, Math.min(100, score));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (value / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', width: 108, height: 108, mx: 'auto' }}>
      <svg viewBox="0 0 96 96" width="108" height="108" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(148, 163, 184, 0.18)" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="url(#healthScoreGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
        <defs>
          <linearGradient id="healthScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="55%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          /100
        </Typography>
      </Box>
      <Chip label={label} size="small" sx={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', fontWeight: 800, bgcolor: alpha('#4F46E5', 0.1), color: '#4F46E5' }} />
    </Box>
  );
}

export default function AssessmentSnapshotSection({
  assessmentSummary,
  assessmentLoading,
  user,
  personalInfo,
  medicalInfo,
  onRetakeAssessment,
}) {
  const navigate = useNavigate();

  const riskScore = useMemo(() => {
    const probability = assessmentSummary?.probability ?? user?.last_assessment_probability ?? 0;
    return Math.round(Math.max(0, Math.min(1, Number(probability) || 0)) * 100);
  }, [assessmentSummary?.probability, user?.last_assessment_probability]);

  const riskLabel = useMemo(() => getRiskLabel(assessmentSummary?.risk_level || user?.last_assessment_risk_level), [assessmentSummary?.risk_level, user?.last_assessment_risk_level]);

  const fastingGlucose = useMemo(() => {
    const lab = medicalInfo?.recent_lab_results?.fasting_glucose;
    return lab?.value != null ? toNumber(lab.value) : null;
  }, [medicalInfo]);

  const fastingMeta = useMemo(() => getFastingLabel(fastingGlucose), [fastingGlucose]);

  const bmi = useMemo(() => {
    if (!personalInfo?.height || !personalInfo?.weight) return null;
    const heightM = Number(personalInfo.height) / 100;
    if (!heightM) return null;
    return Number((Number(personalInfo.weight) / (heightM * heightM)).toFixed(1));
  }, [personalInfo]);

  const bmiMeta = useMemo(() => getBmiLabel(bmi), [bmi]);

  const activityMeta = useMemo(() => getActivityLabel(personalInfo?.activity_level), [personalInfo?.activity_level]);

  const healthScore = useMemo(() => {
    let score = 100;
    score -= riskScore * 0.35;
    if (bmi != null) {
      if (bmi >= 30) score -= 14;
      else if (bmi >= 25) score -= 8;
    }
    if (fastingGlucose != null) {
      if (fastingGlucose >= 126) score -= 12;
      else if (fastingGlucose >= 100) score -= 6;
    }
    const activity = String(personalInfo?.activity_level || '').toLowerCase();
    if (activity.includes('sedentary')) score -= 10;
    else if (activity.includes('lightly')) score -= 4;
    else if (activity.includes('moderately')) score += 4;
    else if (activity.includes('very') || activity.includes('extremely')) score += 8;
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [riskScore, bmi, fastingGlucose, personalInfo?.activity_level]);

  const healthLabel = useMemo(() => {
    if (healthScore >= 80) return 'Excellent';
    if (healthScore >= 65) return 'Good';
    if (healthScore >= 50) return 'Needs Attention';
    return 'High Priority';
  }, [healthScore]);

  const assessmentDate = user?.last_assessment_at || assessmentSummary?.assessment_date || null;
  const assessmentDateText = assessmentDate ? new Date(assessmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No assessment yet';

  const sparkline = useMemo(() => {
    if (fastingGlucose == null) return [];
    return [fastingGlucose - 10, fastingGlucose - 4, fastingGlucose - 1, fastingGlucose + 3, fastingGlucose + 1, fastingGlucose];
  }, [fastingGlucose]);

  if (assessmentLoading) {
    return (
      <Box sx={{ minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading your assessment snapshot...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.2, md: 3 },
          borderRadius: 3,
          border: (t) => `1px solid ${alpha(t.palette.divider, 0.7)}`,
          background: (t) => `linear-gradient(135deg, ${alpha('#FFFFFF', t.palette.mode === 'dark' ? 0.04 : 0.9)} 0%, ${alpha('#EEF2FF', t.palette.mode === 'dark' ? 0.08 : 0.58)} 100%)`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start', mb: 2.5 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
              Health Snapshot
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overview of your current health status
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap">
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
              <AssessmentIcon sx={{ fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Last assessment: {assessmentDateText}
              </Typography>
            </Box>
            {onRetakeAssessment ? (
              <Button
                variant="outlined"
                size="small"
                onClick={onRetakeAssessment}
                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
              >
                Retake assessment
              </Button>
            ) : null}
          </Stack>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(5, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          <Box>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: (t) => `1px solid ${alpha('#FB923C', 0.18)}`, minHeight: 218, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Diabetes Risk
                </Typography>
                <Typography variant="h5" sx={{ mt: 0.75, fontWeight: 900, color: '#F97316' }}>
                  {riskLabel}
                </Typography>
              </Box>
              <GaugeCard score={riskScore} label={`Risk Score ${riskScore}/100`} />
            </Paper>
          </Box>

          <Box>
            <MetricCard
              title="Blood Sugar (Fasting)"
              value={fastingGlucose != null ? `${fastingGlucose} ${medicalInfo?.recent_lab_results?.fasting_glucose?.unit || 'mg/dL'}` : 'No data'}
              helper="Latest fasting blood glucose"
              accent={fastingMeta.color}
              chipLabel={fastingMeta.label}
              chipColor={fastingMeta.color}
              minHeight={218}
            >
              <OpacityIcon fontSize="small" />
            </MetricCard>
            {fastingGlucose != null ? (
              <Box sx={{ mt: -6.25, mb: 1.3, px: 0.75 }}>
                <svg viewBox="0 0 110 40" width="100%" height="40" aria-hidden="true">
                  <path d={buildSparklinePath(sparkline, 110, 32)} fill="none" stroke="#22C55E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Box>
            ) : null}
          </Box>

          <Box>
            <MetricCard
              title="BMI"
              value={bmi != null ? bmi.toFixed(1) : 'No data'}
              helper={bmiMeta.range}
              accent={bmiMeta.color}
              chipLabel={bmiMeta.label}
              chipColor={bmiMeta.color}
              minHeight={218}
            >
              <FitnessCenterIcon fontSize="small" />
            </MetricCard>
          </Box>

          <Box>
            <MetricCard
              title="Activity Level"
              value={activityMeta.label}
              helper={activityMeta.helper}
              accent={activityMeta.color}
              chipLabel={personalInfo?.activity_level || 'Profile'}
              chipColor={activityMeta.color}
              minHeight={218}
            >
              <DirectionsRunIcon fontSize="small" />
            </MetricCard>
          </Box>

          <Box>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: (t) => `1px solid ${alpha('#6366F1', 0.18)}`, minHeight: 218, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Health Score
                </Typography>
                <Typography variant="h5" sx={{ mt: 0.75, fontWeight: 900, color: '#4F46E5' }}>
                  {healthLabel}
                </Typography>
              </Box>
              <RingScore score={healthScore} label={healthLabel} />
            </Paper>
          </Box>
        </Box>

        {!assessmentSummary && !assessmentDate ? (
          <Paper elevation={0} sx={{ mt: 3, p: 2.5, borderRadius: 3, border: (t) => `1px dashed ${alpha(t.palette.divider, 0.8)}`, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              No assessment saved yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto', mb: 2 }}>
              Complete the onboarding questions to generate your health snapshot from the symptom model.
            </Typography>
            <Button variant="contained" onClick={() => (onRetakeAssessment ? onRetakeAssessment() : navigate('/onboarding'))} sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2 }}>
              Start assessment
            </Button>
          </Paper>
        ) : null}
      </Paper>
    </Box>
  );
}