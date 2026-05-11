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

const getRiskGradient = (risk) => {
  const level = (risk || '').toLowerCase();
  if (level === 'high') return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  if (level === 'medium') return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
};

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
        // Try to get cached assessment first
        console.log('📊 Attempting to fetch cached assessment...');
        try {
          response = await getLatestDiabetesAssessment();
          console.log('✅ Cached assessment found:', response);
        } catch (cacheError) {
          // If no cached assessment exists, automatically run first assessment
          console.log('⚠️ No cached assessment found. Running first assessment...');
          console.log('Cache error:', cacheError.response?.data || cacheError.message);
          response = await assessDiabetesRisk(false);
          console.log('✅ First assessment completed:', response);
          // Allow showing assessment insight popup once when user returns to dashboard
          if (response && response.is_cached === false) {
            sessionStorage.setItem('assessmentPopupPostLogin', 'true');
          }
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
          <Button variant="contained" onClick={() => navigate('/questionnaire')} sx={{ mt: 2 }}>
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

  // COMPREHENSIVE CHART CONFIGURATIONS
  const gaugeOptions = {
    chart: { type: 'radialBar', sparkline: { enabled: false } },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: { size: '65%' },
        track: { background: 'rgba(255,255,255,0.1)', strokeWidth: '100%' },
        dataLabels: {
          name: { fontSize: '20px', color: '#ffffff', fontWeight: 800, offsetY: -10 },
          value: { fontSize: '42px', color: '#ffffff', fontWeight: 900, offsetY: 10, formatter: (val) => `${val}%` }
        }
      }
    },
    fill: { type: 'gradient', gradient: { shade: 'dark', type: 'horizontal', gradientToColors: ['#6366f1'], stops: [0, 100] } },
    stroke: { lineCap: 'round' },
    labels: ['Risk Probability'],
    colors: ['#8b5cf6']
  };

  const radarOptions = {
    chart: { type: 'radar', toolbar: { show: false } },
    xaxis: { 
      categories: Object.keys(feature_importance).slice(0, 8),
      labels: { style: { colors: Array(8).fill('#fff'), fontSize: '12px', fontWeight: 600 } }
    },
    yaxis: { show: false },
    fill: { opacity: 0.3 },
    stroke: { show: true, width: 2 },
    colors: ['#22c55e'],
    markers: { size: 4, colors: ['#22c55e'], strokeColor: '#fff', strokeWidth: 2 },
    legend: { show: false },
    plotOptions: { radar: { polygons: { strokeColors: 'rgba(255,255,255,0.1)', fill: { colors: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)'] } } } }
  };

  const barHorizontalOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 8, horizontal: true, distributed: true, barHeight: '75%' } },
    colors: ['#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899', '#f97316', '#14b8a6'],
    dataLabels: { enabled: true, style: { fontSize: '13px', fontWeight: 900, colors: ['#fff'] }, offsetX: 10 },
    xaxis: { 
      categories: Object.keys(feature_importance).slice(0, 8),
      labels: { style: { colors: '#ffffff', fontSize: '13px', fontWeight: 600 } }
    },
    yaxis: { labels: { style: { colors: '#ffffff', fontSize: '12px', fontWeight: 600 } } },
    grid: { borderColor: 'rgba(255,255,255,0.08)', strokeDashArray: 4 },
    tooltip: { theme: 'dark', y: { formatter: (val) => val?.toFixed(4) || '0.0000' } },
    legend: { show: false }
  };

  const donutOptions = {
    chart: { type: 'donut' },
    labels: ['Present', 'Absent'],
    colors: ['#10b981', 'rgba(255,255,255,0.08)'],
    legend: { show: true, position: 'bottom', labels: { colors: '#ffffff' }, fontSize: '14px', fontWeight: 700 },
    dataLabels: { enabled: true, style: { fontSize: '16px', fontWeight: 'bold' } },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: { fontSize: '18px', color: '#ffffff', fontWeight: 700 },
            value: { fontSize: '28px', color: '#ffffff', fontWeight: 900 },
            total: { show: true, label: 'Total', fontSize: '16px', color: '#ffffff', fontWeight: 700, formatter: () => '14' }
          }
        }
      }
    },
    stroke: { width: 0 },
    tooltip: { theme: 'dark' }
  };

  // Series data
  const gaugeSeries = [Math.round(probability * 100)];
  const radarSeries = [{ name: 'Feature Impact', data: Object.values(feature_importance).slice(0, 8).map(v => (v * 100).toFixed(1)) }];
  const barHorizontalSeries = [{ name: 'Importance', data: Object.values(feature_importance).slice(0, 8) }];
  const donutSeries = [symptoms_present.length, 14 - symptoms_present.length];

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)' }}>
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
          borderBottom: '2px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
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
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', letterSpacing: -0.3 }}>
              Comprehensive Analytics Dashboard
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                startIcon={<Refresh />}
                onClick={() => fetchAssessmentData(false)}
                sx={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: 'white',
                  fontWeight: 800,
                  px: 3,
                  '&:hover': { background: 'linear-gradient(135deg, #16a34a, #15803d)' }
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Box sx={{ pt: 12, pb: 8 }}>
        <Container maxWidth="xxl" sx={{ px: { xs: 4, md: 8, lg: 12 } }}>

          {/* Full-Width Banner */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Paper
              sx={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(139, 92, 246, 0.12) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4,
                border: '2px solid rgba(139, 92, 246, 0.25)',
                p: 5,
                mb: 6,
                boxShadow: '0 16px 48px rgba(99, 102, 241, 0.2)'
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Box
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 12px 32px rgba(139, 92, 246, 0.4)'
                      }}
                    >
                      <AssessmentIcon sx={{ fontSize: 38, color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: 'white', letterSpacing: -0.5 }}>
                        Diabetes Risk Assessment Dashboard
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, mt: 0.5 }}>
                        Comprehensive AI-Powered Health Analytics & Visualization
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<TrendingUp />}
                      label="Live Analysis"
                      sx={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#6ee7b7',
                        fontWeight: 800,
                        border: '1.5px solid rgba(16, 185, 129, 0.4)',
                        fontSize: '0.95rem',
                        height: 38
                      }}
                    />
                    <Chip
                      icon={<CheckCircle />}
                      label={`${symptoms_present.length} Symptoms`}
                      sx={{
                        background: 'rgba(244, 114, 182, 0.2)',
                        color: '#f9a8d4',
                        fontWeight: 800,
                        border: '1.5px solid rgba(244, 114, 182, 0.4)',
                        fontSize: '0.95rem',
                        height: 38
                      }}
                    />
                    <Chip
                      label={`${Math.round(confidence * 100)}% Confident`}
                      sx={{
                        background: 'rgba(6, 182, 212, 0.2)',
                        color: '#67e8f9',
                        fontWeight: 800,
                        border: '1.5px solid rgba(6, 182, 212, 0.4)',
                        fontSize: '0.95rem',
                        height: 38
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </motion.div>

          {/* Main Risk Card */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
            <Card
              sx={{
                mb: 6,
                borderRadius: 4,
                overflow: 'hidden',
                background: getRiskGradient(risk_level),
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5)'
              }}
            >
              <CardContent sx={{ p: 6 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 120,
                          height: 120,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                          border: '3px solid rgba(255,255,255,0.4)'
                        }}
                      >
                        {risk_level === 'High' ? <Warning sx={{ fontSize: 50, color: '#fff' }} /> : 
                         risk_level === 'Medium' ? <TrendingUp sx={{ fontSize: 50, color: '#fff' }} /> :
                         <Assignment sx={{ fontSize: 50, color: '#fff' }} />}
                      </Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, display: 'block', mb: 0.5 }}>
                        RISK LEVEL
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 900, color: '#fff', letterSpacing: -1 }}>
                        {risk_level}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, display: 'block', mb: 1 }}>
                        PROBABILITY
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff', mb: 2 }}>
                        {Math.round(probability * 100)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={probability * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          '& .MuiLinearProgress-bar': { backgroundColor: '#fff', borderRadius: 4 }
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, display: 'block', mb: 1 }}>
                        CONFIDENCE
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff', mb: 2 }}>
                        {Math.round(confidence * 100)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={confidence * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          '& .MuiLinearProgress-bar': { backgroundColor: '#fff', borderRadius: 4 }
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, display: 'block', mb: 1 }}>
                        SYMPTOMS
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff' }}>
                        {symptoms_present.length}/14
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>

          {/* Three Chart Row */}
          <Grid container spacing={6} sx={{ mb: 6 }}>
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
                  border: '2px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: 4,
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 12px 36px rgba(139, 92, 246, 0.25)',
                  height: '100%'
                }}
              >
                <CardContent sx={{ p: 5 }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 900, textAlign: 'center' }}>
                    Risk Probability Gauge
                  </Typography>
                  <Chart options={gaugeOptions} series={gaugeSeries} type="radialBar" height={320} />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.1) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: 4,
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 12px 36px rgba(16, 185, 129, 0.25)',
                  height: '100%'
                }}
              >
                <CardContent sx={{ p: 5 }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 900, textAlign: 'center' }}>
                    Symptoms Distribution
                  </Typography>
                  <Chart options={donutOptions} series={donutSeries} type="donut" height={320} />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(74, 222, 128, 0.1) 100%)',
                  border: '2px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: 4,
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 12px 36px rgba(34, 197, 94, 0.25)',
                  height: '100%'
                }}
              >
                <CardContent sx={{ p: 5 }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 900, textAlign: 'center' }}>
                    Feature Impact Radar
                  </Typography>
                  <Chart options={radarOptions} series={radarSeries} type="radar" height={320} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Three Column Section: Feature Importance, Present Symptoms, Recommendations */}
          <Grid container spacing={6} sx={{ alignItems: 'stretch' }}>
            <Grid item xs={12} sm={12} md={4}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(251, 146, 60, 0.08) 100%)',
                  border: '2px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: 4,
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 16px 48px rgba(245, 158, 11, 0.25)',
                  height: 380,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" sx={{ color: 'white', mb: 2, fontWeight: 800, textAlign: 'center', fontSize: '0.95rem' }}>
                    Feature Importance
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Chart options={barHorizontalOptions} series={barHorizontalSeries} type="bar" height={280} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={12} md={4}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(34, 211, 238, 0.1) 100%)',
                  border: '2px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: 4,
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 12px 36px rgba(6, 182, 212, 0.25)',
                  height: 380,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" sx={{ color: 'white', mb: 2, fontWeight: 800, textAlign: 'center', fontSize: '0.95rem' }}>
                    Present Symptoms ({symptoms_present.length})
                  </Typography>
                  <Box sx={{ flex: 1, overflowY: 'auto' }}>
                    {symptoms_present.slice(0, 8).map((symptom, i) => (
                      <Box
                        key={i}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          background: 'rgba(6, 182, 212, 0.1)',
                          border: '1px solid rgba(6, 182, 212, 0.2)',
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5
                        }}
                      >
                        <CheckCircle sx={{ color: '#67e8f9', fontSize: 16 }} />
                        <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.8rem' }}>{symptom}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={12} md={4}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(192, 132, 252, 0.1) 100%)',
                  border: '2px solid rgba(168, 85, 247, 0.2)',
                  borderRadius: 4,
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 12px 36px rgba(168, 85, 247, 0.25)',
                  height: 380,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" sx={{ color: 'white', mb: 2, fontWeight: 800, textAlign: 'center', fontSize: '0.95rem' }}>
                    Recommendations ({recommendations.length})
                  </Typography>
                  <Box sx={{ flex: 1, overflowY: 'auto' }}>
                    {recommendations.slice(0, 6).map((rec, i) => (
                      <Box
                        key={i}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          background: 'rgba(168, 85, 247, 0.1)',
                          border: '1px solid rgba(168, 85, 247, 0.2)',
                          borderRadius: 1.5,
                          display: 'flex',
                          gap: 1
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '0.65rem' }}>
                            {i + 1}
                          </Typography>
                        </Box>
                        <Typography sx={{ color: 'white', fontWeight: 600, lineHeight: 1.4, fontSize: '0.8rem' }}>{rec}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Assessment;
