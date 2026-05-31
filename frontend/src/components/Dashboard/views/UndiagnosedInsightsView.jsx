import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDateFormat } from '../../../hooks/useDateFormat';
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Avatar,
  IconButton,
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
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

import ProgressDonut from '../../DashboardNew/ProgressDonut';

const monoFont = '"JetBrains Mono", "Roboto Mono", Consolas, monospace';

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const deriveRiskFromProbability = (probability) => {
  if (probability == null) return 'Pending';
  const score = clamp01(probability);
  if (score >= 0.7) return 'High';
  if (score >= 0.3) return 'Moderate';
  return 'Low';
};

const getRiskDisplay = (assessmentSummary, user) => {
  const rawProbability = assessmentSummary?.probability ?? user?.last_assessment_probability;
  const probability = rawProbability == null ? null : clamp01(rawProbability);
  const rawLevel = assessmentSummary?.risk_level || user?.last_assessment_risk_level;
  const riskLevel = rawLevel
    ? `${String(rawLevel).charAt(0).toUpperCase()}${String(rawLevel).slice(1).toLowerCase()}`
    : deriveRiskFromProbability(probability);

  return {
    riskLevel,
    probability,
    percent: probability == null ? null : Math.round(probability * 100),
  };
};

function UndiagnosedInsightsView({
  diseaseData,
  completionPct,
  activityItems,
  assessmentSummary,
  user,
}) {
  const { formatDate } = useDateFormat();
  const navigate = useNavigate();
  const answeredQuestions = diseaseData?.answeredQuestions ?? 0;
  const totalQuestions = diseaseData?.totalQuestions ?? 0;
  const progress = Number.isFinite(completionPct) ? Math.round(completionPct) : 0;
  const accountActive = user?.isActive ?? user?.active ?? true;
  const accountStatusLabel = accountActive ? 'Active' : 'Inactive';
  const updatedDate = diseaseData?.lastUpdated ? formatDate(diseaseData.lastUpdated) : 'Not started';
  const riskDisplay = useMemo(() => getRiskDisplay(assessmentSummary, user), [assessmentSummary, user]);

  const resumeAssessment = () => {
    if (progress >= 100) {
      navigate('/assessment');
      return;
    }
    sessionStorage.setItem('resumeAssessmentIndex', String(Math.max(answeredQuestions, 0)));
    navigate('/symptom-assessment?resume=1');
  };

  const recentRows = useMemo(() => {
    if (Array.isArray(activityItems) && activityItems.length > 0) {
      return activityItems.slice(0, 4).map((item, index) => ({
        title: item.title || item.label || `Activity ${index + 1}`,
        detail: item.description || item.detail || 'Progress updated',
        date: item.date || item.time || diseaseData?.lastUpdated,
      }));
    }
    return [
      { title: progress >= 100 ? 'Assessment completed' : 'Assessment in progress', detail: `${answeredQuestions}/${totalQuestions || 0} answers saved`, date: diseaseData?.lastUpdated },
      { title: 'Disease data updated', detail: diseaseData?.disease || 'Questionnaire data pending', date: diseaseData?.lastUpdated },
      { title: 'Risk report status', detail: progress >= 100 ? 'Ready to view' : 'Complete assessment to unlock', date: null },
    ];
  }, [activityItems, answeredQuestions, diseaseData, progress, totalQuestions]);

  const telemetry = [
    {
      label: 'Condition',
      value: diseaseData?.disease || 'Diabetes',
      helper: updatedDate,
      icon: <FavoriteBorderIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: 'Progress',
      value: `${progress}%`,
      helper: progress === 100 ? 'Assessment complete' : 'Resume required',
      icon: <TrendingUpIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: 'Questions',
      value: `${answeredQuestions}/${totalQuestions || 0}`,
      helper: 'Answers saved',
      icon: <AssignmentTurnedInIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: 'Next Action',
      value: 'Assessment',
      helper: progress === 100 ? 'Open report' : 'Continue check-in',
      icon: <BoltIcon sx={{ fontSize: 18 }} />,
      onClick: resumeAssessment,
    },
  ];

  const quickActions = [
    { label: progress >= 100 ? 'View Assessment Report' : 'Start Assessment', desc: progress >= 100 ? 'Open finalized risk report' : 'Resume your check-in', icon: <AssignmentTurnedInIcon fontSize="small" />, action: resumeAssessment },
    { label: 'Check My Risk', desc: 'Review your risk evaluation', icon: <BoltIcon fontSize="small" />, action: () => (progress >= 100 ? navigate('/assessment') : resumeAssessment()) },
    { label: 'Health Resources', desc: 'Read diabetes guidance', icon: <MenuBookIcon fontSize="small" />, action: () => navigate('/articles') },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#090D16', color: '#fff', px: { xs: 2, md: 3.5 }, py: { xs: 3, md: 4 } }}>
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 850, fontSize: { xs: '1.45rem', md: '1.9rem' }, letterSpacing: '-0.02em' }}>
            Welcome back, {user?.fullName?.split(' ')[0] || 'Patient'}!
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1, mt: 0.7, flexWrap: 'wrap' }}>
            <Typography sx={{ color: 'rgba(203,213,225,0.72)', fontSize: '0.95rem' }}>
              Your assessment workspace is ready.
            </Typography>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.65 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: accountActive ? '#5eead4' : '#fb7185', boxShadow: accountActive ? '0 0 14px rgba(94,234,212,0.72)' : '0 0 14px rgba(251,113,133,0.6)' }} />
              <Typography sx={{ color: accountActive ? '#99f6e4' : '#fecdd3', fontSize: '0.78rem', fontFamily: monoFont, fontWeight: 700 }}>
                Status: {accountStatusLabel}
              </Typography>
            </Box>
          </Box>
        </Box>

        <IconButton sx={{ p: 0.25, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', bgcolor: 'rgba(255,255,255,0.03)' }}>
          <Avatar sx={{ width: 38, height: 38, bgcolor: '#2dd4bf', color: '#06211f', fontWeight: 900 }}>
            {user?.fullName?.[0]?.toUpperCase() || 'U'}
          </Avatar>
        </IconButton>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 1.5, md: 2 }, mb: 3 }}>
        {telemetry.map((item) => (
          <Box
            key={item.label}
            onClick={item.onClick}
            sx={{
              py: 1.4,
              px: { xs: 0, sm: 0.5 },
              cursor: item.onClick ? 'pointer' : 'default',
              borderBottom: { xs: '1px solid rgba(255,255,255,0.05)', xl: 'none' },
              '&:hover .telemetry-arrow': { color: '#fff', transform: 'translateX(3px)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box sx={{ color: '#5eead4', display: 'inline-flex' }}>{item.icon}</Box>
              <Typography sx={{ color: 'rgba(148,163,184,0.72)', fontSize: '0.68rem', fontFamily: monoFont, fontWeight: 800, textTransform: 'uppercase' }}>
                {item.label}
              </Typography>
              {item.onClick && <ArrowForwardIcon className="telemetry-arrow" sx={{ ml: 'auto', color: 'rgba(148,163,184,0.5)', fontSize: 16, transition: 'all 0.18s ease' }} />}
            </Box>
            <Typography sx={{ color: '#fff', fontWeight: 850, fontSize: { xs: '1.35rem', md: '1.55rem' }, lineHeight: 1.1 }}>
              {item.value}
            </Typography>
            <Typography sx={{ color: 'rgba(203,213,225,0.58)', fontSize: '0.74rem', fontFamily: monoFont, mt: 0.65 }}>
              {item.helper}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(280px, 0.8fr)' }, gap: 2.2, mb: 2.6 }}>
        <Box sx={{ bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 1.5, p: { xs: 2.2, md: 2.8 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) 150px' }, gap: 2.5, alignItems: 'center' }}>
            <Box>
              <Typography sx={{ color: 'rgba(148,163,184,0.72)', fontSize: '0.72rem', fontFamily: monoFont, fontWeight: 800, textTransform: 'uppercase', mb: 1 }}>
                Continue health assessment
              </Typography>
              <Typography sx={{ color: '#fff', fontWeight: 850, fontSize: { xs: '1.45rem', md: '2rem' }, letterSpacing: '-0.02em', lineHeight: 1.12 }}>
                Complete your onboarding
              </Typography>
              <Typography sx={{ color: 'rgba(203,213,225,0.68)', mt: 1.1, maxWidth: 560, lineHeight: 1.7 }}>
                Continue from your saved answers and unlock a personalized risk report once every required question is complete.
              </Typography>
              <Button
                endIcon={<ChevronRightIcon />}
                onClick={resumeAssessment}
                sx={{
                  mt: 2.2,
                  px: 2.3,
                  py: 1,
                  borderRadius: 1.25,
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 800,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  '&:hover': { bgcolor: 'rgba(45,212,191,0.08)', borderColor: 'rgba(45,212,191,0.28)' },
                }}
              >
                {progress >= 100 ? 'View Assessment Report' : 'Continue Assessment'}
              </Button>
            </Box>
            <Box sx={{ position: 'relative', display: 'grid', placeItems: 'center', minHeight: 150 }}>
              <Box sx={{ position: 'absolute', width: 132, height: 132, borderRadius: '50%', background: 'repeating-conic-gradient(from -90deg, rgba(94,234,212,0.36) 0deg 1deg, transparent 1deg 8deg)', opacity: 0.65, mask: 'radial-gradient(circle, transparent 58%, #000 59%, #000 64%, transparent 65%)' }} />
              <ProgressDonut value={progress} label="Complete" size={126} />
            </Box>
          </Box>
        </Box>

        <DarkLedger title="Recent Activity" rows={recentRows} empty="No recent activity yet" />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2.2 }}>
        <DarkPanel title="Health Insights" action>
          <Box sx={{ display: 'flex', gap: 1.35, alignItems: 'flex-start' }}>
            <Box sx={{ width: 38, height: 38, borderRadius: 1.3, display: 'grid', placeItems: 'center', bgcolor: 'rgba(45,212,191,0.08)', color: '#5eead4' }}>
              <HealthAndSafetyIcon />
            </Box>
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 780, mb: 0.4 }}>Assessment unlocks insights</Typography>
              <Typography sx={{ color: 'rgba(203,213,225,0.66)', fontSize: '0.86rem', lineHeight: 1.7 }}>
                Finish your saved questionnaire to generate a clearer risk profile and recommendations.
              </Typography>
            </Box>
          </Box>
        </DarkPanel>

        <DarkPanel title="Risk Overview">
          <Box sx={{ display: 'grid', placeItems: 'center', py: 1 }}>
            <Box sx={{ width: 190, height: 92, borderTopLeftRadius: 190, borderTopRightRadius: 190, overflow: 'hidden', position: 'relative', background: `conic-gradient(from 180deg at 50% 100%, #22c55e 0deg, #eab308 72deg, #f97316 126deg, #ef4444 ${Math.max(16, Math.round((riskDisplay.probability ?? 0) * 180))}deg, rgba(15,23,42,0.62) ${Math.max(16, Math.round((riskDisplay.probability ?? 0) * 180))}deg 180deg, transparent 180deg)` }}>
              <Box sx={{ position: 'absolute', left: '50%', bottom: -1, transform: 'translateX(-50%)', width: 148, height: 72, borderTopLeftRadius: 148, borderTopRightRadius: 148, bgcolor: '#090D16' }} />
            </Box>
            <Typography sx={{ color: '#fff', fontWeight: 760, mt: 1.4 }}>
              Risk Level: {riskDisplay.riskLevel}
            </Typography>
            {riskDisplay.percent != null && (
              <Typography sx={{ color: '#5eead4', fontFamily: monoFont, fontWeight: 850, fontSize: '0.82rem', mt: 0.4 }}>
                Probability: {riskDisplay.percent}%
              </Typography>
            )}
            <Typography sx={{ color: 'rgba(203,213,225,0.62)', fontSize: '0.82rem', mt: 0.6, textAlign: 'center' }}>
              {progress >= 100 ? 'Your latest report is ready.' : 'Complete your assessment to calculate risk.'}
            </Typography>
          </Box>
        </DarkPanel>

        <DarkPanel title="Quick Actions">
          <Stack spacing={1}>
            {quickActions.map((item) => (
              <Box
                key={item.label}
                onClick={item.action}
                sx={{
                  p: 1.35,
                  borderRadius: 1.25,
                  bgcolor: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  cursor: 'pointer',
                  '&:hover .quick-arrow': { color: '#fff', transform: 'translate(2px, -2px)' },
                }}
              >
                <Box sx={{ color: '#5eead4', display: 'inline-flex' }}>{item.icon}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: '#fff', fontWeight: 760, fontSize: '0.9rem' }}>{item.label}</Typography>
                  <Typography sx={{ color: 'rgba(203,213,225,0.55)', fontSize: '0.74rem' }}>{item.desc}</Typography>
                </Box>
                <ArrowOutwardIcon className="quick-arrow" sx={{ fontSize: 16, color: 'rgba(148,163,184,0.55)', transition: 'all 0.18s ease' }} />
              </Box>
            ))}
          </Stack>
        </DarkPanel>
      </Box>
    </Box>
  );
}

function DarkPanel({ title, children, action = false }) {
  return (
    <Box sx={{ minHeight: 230, bgcolor: 'rgba(255,255,255,0.015)', borderRadius: 1.5, p: 2.2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={{ color: '#fff', fontWeight: 820, fontSize: '1rem' }}>{title}</Typography>
        {action && <ArrowOutwardIcon sx={{ color: 'rgba(255,255,255,0.78)', fontSize: 17 }} />}
      </Box>
      {children}
    </Box>
  );
}

function DarkLedger({ title, rows, empty }) {
  const { formatDate } = useDateFormat();
  const visibleRows = rows?.length
    ? rows
    : [{ title: empty, detail: 'Complete your first action to populate this ledger.', date: null }];

  return (
    <Box sx={{ minHeight: 250, p: { xs: 2, md: 2.4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
        <Typography sx={{ color: '#fff', fontWeight: 820, fontSize: '1rem' }}>{title}</Typography>
        <ArrowOutwardIcon sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 17 }} />
      </Box>
      {visibleRows.map((row, index) => (
        <Box key={`${row.title}-${index}`} sx={{ py: 1.25, borderBottom: index === visibleRows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1.5 }}>
            <Typography sx={{ color: '#fff', fontWeight: 720, fontSize: '0.9rem' }}>{row.title}</Typography>
            <Typography sx={{ color: 'rgba(203,213,225,0.55)', fontFamily: monoFont, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
              {row.date ? formatDate(row.date) : '--'}
            </Typography>
          </Box>
          <Typography sx={{ color: 'rgba(203,213,225,0.55)', fontSize: '0.74rem', mt: 0.25 }}>{row.detail}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export default UndiagnosedInsightsView;
