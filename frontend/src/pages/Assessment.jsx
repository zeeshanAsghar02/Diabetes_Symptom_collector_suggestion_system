import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Container,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  Assessment as AssessmentIcon,
  Assignment,
  Warning,
  CheckCircle,
  Refresh,
  PlayArrow
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Chart from 'react-apexcharts';
import { assessDiabetesRisk, getLatestDiabetesAssessment } from '../utils/api';

const getRiskColor = (risk) => {
  const level = (risk || '').toLowerCase();
  if (level === 'high') return '#ef4444';
  if (level === 'medium') return '#f59e0b';
  return '#22c55e';
};

const TOTAL_SYMPTOMS = 14;
const monoFont = '"JetBrains Mono", "Roboto Mono", Consolas, monospace';

const formatDecimal = (value, digits = 2) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : Number(0).toFixed(digits);
};

const formatPercent = (value, digits = 0) => `${formatDecimal(Number(value) * 100, digits)}%`;

const StackPanel = ({ title, subtitle, children }) => (
  <Card sx={{ height: '100%', minHeight: 640, bgcolor: 'rgba(17,24,39,0.88)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1.5, boxShadow: '0 22px 64px rgba(0,0,0,0.3)', backdropFilter: 'blur(18px)' }}>
    <CardContent sx={{ p: { xs: 2, md: 2.5 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 1.6 }}>
        <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1rem' }}>{title}</Typography>
        <Typography sx={{ color: 'rgba(203,213,225,0.58)', fontSize: '0.75rem', fontFamily: monoFont }}>{subtitle}</Typography>
      </Box>
      {children}
    </CardContent>
  </Card>
);

const TelemetryTile = ({ label, value, tone }) => (
  <Box sx={{ p: 1.45, bgcolor: 'rgba(15,23,42,0.72)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 1 }}>
    <Typography sx={{ color: 'rgba(148,163,184,0.82)', fontFamily: monoFont, fontSize: '0.66rem', fontWeight: 700 }}>{label.toUpperCase()}</Typography>
    <Typography sx={{ color: tone, fontFamily: monoFont, fontWeight: 850, fontSize: '1.15rem' }}>{value}</Typography>
  </Box>
);

const ClinicalLogRow = ({ title, detail, status, active = false }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: '10px 1fr auto', alignItems: 'center', gap: 1.2, p: 1.35, mb: 1, bgcolor: active ? 'rgba(45,212,191,0.07)' : 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.055)', borderRadius: 1 }}>
    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: active ? '#2dd4bf' : '#64748b', boxShadow: active ? '0 0 14px rgba(45,212,191,0.62)' : 'none' }} />
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ color: '#f8fafc', fontWeight: 720, fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Typography>
      <Typography sx={{ color: 'rgba(203,213,225,0.58)', fontFamily: monoFont, fontSize: '0.68rem' }}>{detail}</Typography>
    </Box>
    <Typography sx={{ color: active ? '#99f6e4' : '#cbd5e1', fontFamily: monoFont, fontWeight: 700, fontSize: '0.66rem' }}>{status}</Typography>
  </Box>
);

const Assessment = () => {
  const navigate = useNavigate();
  const [assessmentData, setAssessmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/signin', { 
            state: { 
              message: 'Please sign in to view your risk assessment',
              returnTo: '/assessment'
            } 
          });
          return;
        }

        // Verify token is valid by fetching user
        const user = await getCurrentUser();
        if (!user) {
          navigate('/signin', { 
            state: { 
              message: 'Session expired. Please sign in again.',
              returnTo: '/assessment'
            } 
          });
          return;
        }

        // Token is valid, fetch assessment
        fetchAssessmentData();
      } catch (err) {
        console.error('Auth check error:', err);
        navigate('/signin', { 
          state: { 
            message: 'Authentication error. Please sign in again.',
            returnTo: '/assessment'
          } 
        });
      }
    };

    checkAuthAndFetch();
  }, [navigate]);

  const fetchAssessmentData = async (forceNew = false) => {
    try {
      setLoading(true);
      setError('');

      let response;
      
      if (forceNew) {
        // Explicitly force a new assessment
        console.log('🔄 Running new assessment (force_new=true)...');
        response = await assessDiabetesRisk(true);
        // Allow showing assessment insight popup once when user returns to dashboard
        if (response && response.is_cached === false) {
          sessionStorage.setItem('assessmentPopupPostLogin', 'true');
        }
      } else {
        // Try to get cached assessment first (gracefully handle 404 from older backend)
        console.log('📊 Attempting to fetch cached assessment...');
        let cacheError = false;
        try {
          response = await getLatestDiabetesAssessment();
        } catch (cacheErr) {
          console.warn('⚠️ Cache endpoint failed (may be older backend), falling through to run assessment:', cacheErr?.response?.status, cacheErr?.message);
          cacheError = true;
        }

        if (cacheError || response?.has_assessment === false) {
          console.log('⚠️ No cached assessment found. Running first assessment...');
          response = await assessDiabetesRisk(false);
          console.log('✅ First assessment completed:', response);
          // Allow showing assessment insight popup once when user returns to dashboard
          if (response && response.is_cached === false) {
            sessionStorage.setItem('assessmentPopupPostLogin', 'true');
          }
        } else {
          console.log('✅ Cached assessment found:', response);
        }
      }
      
      // Validate response structure
      if (!response) {
        console.error('❌ No response received from assessment API');
        setError('No response from server. Please try again.');
        setLoading(false);
        return;
      }
      
      console.log('📦 Assessment response:', response);
      
      if (!response.has_assessment && !response.result) {
        console.error('❌ Invalid response structure:', response);
        setError('Please complete the symptom questionnaire first, then return here to view your results.');
        setLoading(false);
        return;
      }
      
      const result = response?.result || {};
      const features = response?.features || {};

      const symptoms_present = Object.entries(features)
        .filter(([k, v]) => !['Age', 'Gender', 'Obesity'].includes(k) && Number(v) === 1)
        .map(([k]) => k);

      const feature_importance = {};
      if (result.feature_importance && typeof result.feature_importance === 'object') {
        Object.entries(result.feature_importance).forEach(([k, v]) => {
          if (v && typeof v === 'object' && typeof v.importance === 'number') {
            feature_importance[k] = v.importance;
          }
        });
      }

      const normalized = {
        risk_level: (result.risk_level || 'low').charAt(0).toUpperCase() + (result.risk_level || 'low').slice(1),
        probability: Number(result.diabetes_probability || 0),
        confidence: Number(result.confidence || 0),
        recommendations: result?.recommendations?.general_recommendations || [],
        next_steps: result?.recommendations?.next_steps || [],
        feature_importance,
        symptoms_present,
        medical_reasoning: result?.llm_insights?.medical_reasoning || '',
        clinical_notes: result?.llm_insights?.clinical_notes || '',
        priority_symptoms: result?.llm_insights?.priority_symptoms || [],
        clinical_actions: result?.llm_insights?.recommended_actions || [],
        urgency: result?.llm_insights?.urgency_level || 'routine'
      };

      setAssessmentData(normalized);
      
      // Clear all temporary onboarding storage after successful assessment load
      sessionStorage.removeItem('pendingOnboardingAnswers');
      sessionStorage.removeItem('onboardingState');
      sessionStorage.removeItem('returnToSymptomAssessment');
      sessionStorage.removeItem('answersSavedAfterLogin');
      localStorage.removeItem('onboardingState');
      localStorage.removeItem('redirectAfterLogin');
      console.log('🧹 Cleared all temporary storage after loading assessment');
    } catch (err) {
      console.error('Assessment fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch assessment data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0e27' }}>
        <Box sx={{ textAlign: 'center' }}>
          <LinearProgress sx={{ mb: 2, width: 300 }} />
          <Typography sx={{ color: 'white' }}>Loading assessment...</Typography>
        </Box>
      </Box>
    );
  }

  if (error || !assessmentData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0e27' }}>
        <Card sx={{ p: 4, maxWidth: 500 }}>
          <Typography variant="h6" color="error" gutterBottom>Error Loading Assessment</Typography>
          <Typography>{error || 'No data available'}</Typography>
          <Button variant="contained" onClick={() => navigate('/symptom-assessment')} sx={{ mt: 2 }}>
            Return to Questionnaire
          </Button>
        </Card>
      </Box>
    );
  }

  const {
    risk_level,
    probability,
    confidence,
    recommendations,
    next_steps,
    feature_importance,
    symptoms_present
  } = assessmentData;

  const featureEntries = Object.entries(feature_importance)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 8);
  const featureLabels = featureEntries.length ? featureEntries.map(([label]) => label) : ['Age', 'Gender', 'BMI', 'Glucose', 'Family History', 'Activity', 'Sleep', 'Hydration'];
  const featureValues = featureEntries.length ? featureEntries.map(([, value]) => Number(value) || 0) : Array(8).fill(0);
  const presentCount = symptoms_present.length;
  const absentCount = Math.max(TOTAL_SYMPTOMS - presentCount, 0);
  const riskColor = getRiskColor(risk_level);

  // COMPREHENSIVE CHART CONFIGURATIONS
  const gaugeOptions = {
    chart: { type: 'radialBar', sparkline: { enabled: true }, background: 'transparent' },
    plotOptions: {
      radialBar: {
        startAngle: -150,
        endAngle: 150,
        hollow: { size: '74%', background: 'transparent' },
        track: { background: 'rgba(255,255,255,0.055)', strokeWidth: '72%', margin: 0 },
        dataLabels: {
          name: { fontSize: '11px', color: 'rgba(226,232,240,0.62)', fontWeight: 700, offsetY: 20, fontFamily: monoFont },
          value: { fontSize: '34px', color: '#f8fafc', fontWeight: 800, offsetY: -10, fontFamily: monoFont, formatter: (val) => `${formatDecimal(val, 0)}%` }
        }
      }
    },
    fill: { type: 'gradient', gradient: { shade: 'dark', type: 'horizontal', gradientToColors: ['#34d399'], stops: [0, 100] } },
    stroke: { lineCap: 'round', width: 2 },
    labels: ['Risk Probability'],
    colors: [riskColor]
  };

  const radarOptions = {
    chart: { type: 'radar', toolbar: { show: false }, background: 'transparent' },
    xaxis: { 
      categories: featureLabels,
      labels: { style: { colors: Array(featureLabels.length).fill('rgba(226,232,240,0.72)'), fontSize: '10px', fontFamily: monoFont, fontWeight: 600 } }
    },
    yaxis: { show: false, min: 0, max: Math.max(...featureValues, 1) },
    fill: { opacity: 0.16 },
    stroke: { show: true, width: 2, curve: 'straight' },
    colors: ['#2dd4bf'],
    markers: { size: 3, colors: ['#2dd4bf'], strokeColor: '#0f172a', strokeWidth: 2 },
    legend: { show: false },
    grid: { borderColor: 'rgba(255,255,255,0.03)' },
    tooltip: { theme: 'dark', y: { formatter: (val) => formatDecimal(val, 2) } },
    plotOptions: { radar: { polygons: { strokeColors: 'rgba(255,255,255,0.045)', connectorColors: 'rgba(255,255,255,0.045)', fill: { colors: ['rgba(255,255,255,0.012)', 'rgba(255,255,255,0.024)'] } } } }
  };

  const barHorizontalOptions = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    plotOptions: { bar: { borderRadius: 3, horizontal: true, distributed: false, barHeight: '58%' } },
    colors: ['#38bdf8'],
    dataLabels: { enabled: true, formatter: (val) => formatDecimal(val, 2), style: { fontSize: '11px', fontWeight: 700, colors: ['#e2e8f0'], fontFamily: monoFont }, offsetX: 8 },
    xaxis: { 
      categories: featureLabels,
      labels: { formatter: (val) => formatDecimal(val, 2), style: { colors: 'rgba(226,232,240,0.58)', fontSize: '10px', fontFamily: monoFont } },
      axisBorder: { color: 'rgba(255,255,255,0.06)' },
      axisTicks: { color: 'rgba(255,255,255,0.06)' }
    },
    yaxis: { labels: { style: { colors: '#f8fafc', fontSize: '11px', fontWeight: 600, fontFamily: monoFont } } },
    grid: { borderColor: 'rgba(255,255,255,0.03)', strokeDashArray: 3 },
    tooltip: { theme: 'dark', y: { formatter: (val) => formatDecimal(val, 2) } },
    legend: { show: false }
  };

  const donutOptions = {
    chart: { type: 'donut', background: 'transparent' },
    labels: ['Present', 'Absent'],
    colors: ['#34d399', 'rgba(148,163,184,0.12)'],
    legend: { show: true, position: 'bottom', labels: { colors: '#cbd5e1' }, fontSize: '11px', fontFamily: monoFont, fontWeight: 600 },
    dataLabels: { enabled: true, formatter: (val) => `${formatDecimal(val, 0)}%`, style: { fontSize: '11px', fontWeight: 'bold', fontFamily: monoFont } },
    plotOptions: {
      pie: {
        donut: {
          size: '78%',
          labels: {
            show: true,
            name: { fontSize: '12px', color: '#94a3b8', fontWeight: 700, fontFamily: monoFont },
            value: { fontSize: '26px', color: '#f8fafc', fontWeight: 800, fontFamily: monoFont },
            total: { show: true, label: 'Evaluated', fontSize: '11px', color: '#94a3b8', fontWeight: 700, fontFamily: monoFont, formatter: () => String(TOTAL_SYMPTOMS) }
          }
        }
      }
    },
    stroke: { width: 0 },
    tooltip: { theme: 'dark' }
  };

  // Series data
  const gaugeSeries = [Math.round(probability * 100)];
  const radarSeries = [{ name: 'Feature Impact', data: featureValues.map((value) => Number(formatDecimal(value, 2))) }];
  const barHorizontalSeries = [{ name: 'Importance', data: featureValues.map((value) => Number(formatDecimal(value, 2))) }];
  const donutSeries = [presentCount, absentCount];

  return (
    <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle at 18% 0%, rgba(45,212,191,0.08), transparent 28%), linear-gradient(135deg, #050816 0%, #090f1f 48%, #050816 100%)' }}>
      {/* Fixed Header */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          background: 'rgba(10, 14, 39, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.42)'
        }}
      >
        <Container maxWidth={false}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, px: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard')}
              sx={{
                color: 'white',
                fontWeight: 800,
                '&:hover': { background: 'rgba(139, 92, 246, 0.15)' }
              }}
            >
              Dashboard
            </Button>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'white', letterSpacing: 0, fontFamily: monoFont }}>
              MEDICAL TELEMETRY COMMAND
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                startIcon={<Refresh />}
                onClick={() => fetchAssessmentData(false)}
                sx={{
                  background: '#111827',
                  color: 'white',
                  fontWeight: 700,
                  px: 3,
                  border: '1px solid rgba(255,255,255,0.1)',
                  '&:hover': { background: '#172033', borderColor: 'rgba(45,212,191,0.35)' }
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box sx={{ pt: 11, pb: 6 }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 3, xl: 5 } }}>
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Paper sx={{ bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 1.5, p: { xs: 2, md: 3 }, mb: 2.5, boxShadow: '0 24px 70px rgba(0,0,0,0.34)' }}>
              <Grid container spacing={2.5} alignItems="center">
                <Grid item xs={12} lg={5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 46, height: 46, borderRadius: 1.25, display: 'grid', placeItems: 'center', bgcolor: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.18)' }}>
                      <AssessmentIcon sx={{ color: '#5eead4' }} />
                    </Box>
                    <Box>
                      <Typography sx={{ color: '#f8fafc', fontWeight: 800, letterSpacing: 0, fontSize: { xs: '1.2rem', md: '1.45rem' } }}>
                        Diabetes Risk Assessment Report
                      </Typography>
                      <Typography sx={{ color: 'rgba(203,213,225,0.66)', fontSize: '0.86rem', fontFamily: monoFont }}>
                        AI-assisted clinical telemetry snapshot
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} lg={7}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1.2fr repeat(3, 1fr)' }, gap: 1.25 }}>
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(15,23,42,0.78)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 1 }}>
                      <Typography sx={{ color: 'rgba(148,163,184,0.82)', fontFamily: monoFont, fontSize: '0.68rem', fontWeight: 700 }}>RISK LEVEL</Typography>
                      <Typography sx={{ color: '#6ee7b7', fontFamily: monoFont, fontWeight: 900, fontSize: '1.2rem', textShadow: '0 0 18px rgba(52,211,153,0.34)' }}>{risk_level.toUpperCase()} RISK</Typography>
                    </Box>
                    {[
                      ['PROBABILITY', formatPercent(probability, 0)],
                      ['CONFIDENCE', formatPercent(confidence, 0)],
                      ['SYMPTOMS', `${presentCount}/${TOTAL_SYMPTOMS}`],
                    ].map(([label, value]) => (
                      <Box key={label} sx={{ p: 1.5, bgcolor: 'rgba(15,23,42,0.58)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 1 }}>
                        <Typography sx={{ color: 'rgba(148,163,184,0.82)', fontFamily: monoFont, fontSize: '0.68rem', fontWeight: 700 }}>{label}</Typography>
                        <Typography sx={{ color: '#f8fafc', fontFamily: monoFont, fontWeight: 800, fontSize: '1.16rem' }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </motion.div>

          <Grid container spacing={2.5} sx={{ alignItems: 'stretch' }}>
            <Grid item xs={12} xl={4}>
              <StackPanel title="Risk Telemetry" subtitle="Probability and symptom distribution">
                <Box sx={{ position: 'relative', display: 'grid', placeItems: 'center', minHeight: 276, '&:before': { content: '""', position: 'absolute', width: 232, height: 232, borderRadius: '50%', background: 'repeating-conic-gradient(from -150deg, rgba(94,234,212,0.34) 0deg 1deg, transparent 1deg 8deg)', opacity: 0.5, mask: 'radial-gradient(circle, transparent 59%, #000 60%, #000 64%, transparent 65%)' } }}>
                  <Chart options={gaugeOptions} series={gaugeSeries} type="radialBar" height={260} />
                </Box>
                <Box sx={{ height: 1, bgcolor: 'rgba(255,255,255,0.06)', my: 1.5 }} />
                <Chart options={donutOptions} series={donutSeries} type="donut" height={250} />
              </StackPanel>
            </Grid>

            <Grid item xs={12} xl={4}>
              <StackPanel title="AI Model Interpretability" subtitle="Feature impact and weighted importance">
                <Chart options={radarOptions} series={radarSeries} type="radar" height={278} />
                <Box sx={{ height: 1, bgcolor: 'rgba(255,255,255,0.06)', my: 1.5 }} />
                <Chart options={barHorizontalOptions} series={barHorizontalSeries} type="bar" height={275} />
              </StackPanel>
            </Grid>

            <Grid item xs={12} xl={4}>
              <StackPanel title={`Present Symptoms Logs`} subtitle={`${presentCount} symptoms reported • ${TOTAL_SYMPTOMS} symptoms evaluated`}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2, mb: 2 }}>
                  <TelemetryTile label="Reported" value={presentCount} tone="#5eead4" />
                  <TelemetryTile label="Evaluated" value={TOTAL_SYMPTOMS} tone="#93c5fd" />
                  <TelemetryTile label="Absent" value={absentCount} tone="#cbd5e1" />
                  <TelemetryTile label="Status" value={presentCount === 0 ? 'CLEAR' : 'VERIFY'} tone={presentCount === 0 ? '#86efac' : '#fbbf24'} />
                </Box>
                <Box sx={{ flex: 1, minHeight: 390, overflowY: 'auto', pr: 0.5 }}>
                  {presentCount === 0 ? (
                    Array.from({ length: 7 }).map((_, index) => (
                      <ClinicalLogRow key={index} title={`Symptom channel ${String(index + 1).padStart(2, '0')}`} detail="No positive signal detected" status="Verified clear" />
                    ))
                  ) : (
                    symptoms_present.map((symptom, index) => (
                      <ClinicalLogRow key={symptom} title={symptom} detail={`Positive response recorded in channel ${String(index + 1).padStart(2, '0')}`} status="Present" active />
                    ))
                  )}
                </Box>
              </StackPanel>
            </Grid>
          </Grid>

          <Paper sx={{ mt: 2.5, bgcolor: 'rgba(17,24,39,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1.5, p: { xs: 2, md: 2.75 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
              <Box>
                <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.1rem' }}>Recommendations Matrix</Typography>
                <Typography sx={{ color: 'rgba(203,213,225,0.62)', fontFamily: monoFont, fontSize: '0.78rem' }}>{recommendations.length} prioritized care guidance items</Typography>
              </Box>
              <Chip label="CLINICAL REVIEW ADVISED" sx={{ bgcolor: 'rgba(45,212,191,0.08)', color: '#99f6e4', border: '1px solid rgba(45,212,191,0.2)', fontFamily: monoFont, fontWeight: 700 }} />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' }, gap: 1.5 }}>
              {(recommendations.length ? recommendations : ['Maintain regular health monitoring and follow up with a qualified clinician.']).map((rec, i) => (
                <Box key={`${rec}-${i}`} sx={{ position: 'relative', p: 2, pl: 3, bgcolor: 'rgba(15,23,42,0.58)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 1.25, '&:before': { content: '""', position: 'absolute', left: 12, top: 20, bottom: 20, width: 1, bgcolor: 'rgba(45,212,191,0.22)' } }}>
                  <Box sx={{ position: 'absolute', left: 8.5, top: 20, width: 8, height: 8, borderRadius: '50%', bgcolor: '#2dd4bf', boxShadow: '0 0 14px rgba(45,212,191,0.72)' }} />
                  <Typography sx={{ color: '#f8fafc', fontWeight: 760, lineHeight: 1.45, mb: 0.7 }}>{rec}</Typography>
                  <Typography sx={{ color: 'rgba(203,213,225,0.62)', fontSize: '0.82rem', lineHeight: 1.6 }}>Telemetry recommendation #{String(i + 1).padStart(2, '0')} generated from the current assessment model outputs.</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Assessment;
