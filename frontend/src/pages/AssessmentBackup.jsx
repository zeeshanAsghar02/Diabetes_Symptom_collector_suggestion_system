import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Paper,
  Container,
  Stack
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  TrendingDown,
  Assessment as AssessmentIcon,
  Warning,
  CheckCircle,
  Info,
  Refresh,
  Download,
  Share
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Chart from 'react-apexcharts';
import { assessDiabetesRisk } from '../utils/api';

const getRiskColor = (risk) => {
  const level = (risk || '').toLowerCase();
  if (level === 'high') return '#ef4444';
  if (level === 'medium') return '#f59e0b';
  return '#22c55e';
};

const getRiskGradient = (risk) => {
  const level = (risk || '').toLowerCase();
  if (level === 'high') return 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)';
  if (level === 'medium') return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  return 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)';
};

const getRiskIcon = (risk) => {
  const level = (risk || '').toLowerCase();
  if (level === 'high') return <Warning sx={{ color: '#fff', fontSize: 40 }} />;
  if (level === 'medium') return <TrendingUp sx={{ color: '#fff', fontSize: 40 }} />;
  return <CheckCircle sx={{ color: '#fff', fontSize: 40 }} />;
};

const Assessment = () => {
  const navigate = useNavigate();
  const [assessmentData, setAssessmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssessmentData();
  }, []);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await assessDiabetesRisk();
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
        medical_reasoning: result?.llm_insights?.medical_reasoning || result?.assessment_summary || '',
        clinical_notes: result?.llm_insights?.clinical_notes || '',
        priority_symptoms: result?.llm_insights?.priority_symptoms || result?.recommendations?.priority_symptoms || [],
        clinical_actions: result?.recommendations?.clinical_actions || result?.recommendations?.next_steps || [],
        urgency: result?.llm_insights?.urgency_level || result?.recommendations?.urgency || 'routine'
      };

      setAssessmentData(normalized);
    } catch (err) {
      console.error('Error fetching assessment data:', err);
      setError('Unable to load assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)',
          color: 'white'
        }}
      >
        <Typography variant="h6">Loading assessment...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          background: 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)',
          color: 'white'
        }}
      >
        <Typography variant="h6">{error}</Typography>
        <Button
          variant="contained"
          onClick={fetchAssessmentData}
          sx={{ background: '#667eea', color: 'white', fontWeight: 700 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!assessmentData) {
    return null;
  }

  const {
    risk_level,
    probability,
    confidence,
    recommendations,
    next_steps,
    feature_importance,
    symptoms_present,
    medical_reasoning,
    clinical_notes,
    priority_symptoms,
    clinical_actions,
    urgency
  } = assessmentData;

  const gaugeOptions = {
    chart: {
      type: 'radialBar',
      height: 280,
      background: 'transparent',
      toolbar: { show: false }
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: {
          background: 'rgba(255,255,255,0.1)',
          strokeWidth: '90%',
          margin: 10
        },
        dataLabels: {
          name: { show: false },
          value: {
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold',
            offsetY: -5,
            formatter: (val) => `${val}%`
          }
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'radial',
        shadeIntensity: 0.5,
        gradientToColors: [getRiskColor(risk_level)],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.8,
        stops: [0, 100]
      }
    },
    stroke: { lineCap: 'round', width: 8 },
    labels: ['Risk Probability'],
    colors: [getRiskColor(risk_level)]
  };

  const donutOptions = {
    chart: { type: 'donut', height: 280, background: 'transparent', toolbar: { show: false } },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Symptoms',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              formatter: () => '14'
            },
            value: {
              show: true,
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0)
            }
          }
        }
      }
    },
    labels: ['Present', 'Absent'],
    colors: ['#FF6B35', 'rgba(255,255,255,0.1)'],
    legend: { show: false },
    dataLabels: {
      enabled: true,
      style: { colors: ['white'] },
      formatter: (val) => `${val.toFixed(0)}%`
    },
    stroke: { width: 0 }
  };

  const barOptions = {
    chart: { type: 'bar', height: 280, background: 'transparent', toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: true, borderRadius: 6, dataLabels: { position: 'top' } }
    },
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      style: { colors: ['white'], fontSize: '14px', fontWeight: 'bold' },
      formatter: (val) => val.toFixed(2),
      offsetX: 10
    },
    xaxis: {
      categories: Object.keys(feature_importance),
      labels: { style: { colors: 'rgba(255,255,255,0.7)', fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { style: { colors: 'rgba(255,255,255,0.7)', fontSize: '12px' } }
    },
    grid: {
      borderColor: 'rgba(255,255,255,0.1)',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: false } }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: ['#FF6B35'],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.8,
        stops: [0, 100]
      }
    },
    colors: ['#FF6B35']
  };

  const gaugeSeries = [Math.round(probability * 100)];
  const donutSeries = [symptoms_present.length, Math.max(14 - symptoms_present.length, 0)];
  const barSeries = [{ name: 'Importance', data: Object.values(feature_importance) }];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d1b2a 0%, #1a2942 40%, #162a47 100%)',
        color: 'white',
        fontFamily: "'Inter', 'Poppins', 'Segoe UI', sans-serif"
      }}
    >
      <Box
        sx={{
          background: 'rgba(10, 15, 28, 0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(100, 200, 255, 0.12)',
          p: 2,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton onClick={() => navigate('/dashboard')} sx={{ color: 'white' }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', letterSpacing: 0.4 }}>
                Dashboard / Assessment
              </Typography>
            </Box>
            <Box />
          </Box>
        </Container>
      </Box>

      <Box sx={{ width: '100%', px: { xs: 1, sm: 2, md: 3 }, py: 3 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 0, md: 1 } }}>
          <Card
            elevation={8}
            sx={{
              mb: 2,
              borderRadius: 3,
              overflow: 'hidden',
              background: 'linear-gradient(120deg, rgba(90, 189, 255, 0.25) 0%, rgba(129, 140, 248, 0.22) 50%, rgba(147, 51, 234, 0.2) 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
              backdropFilter: 'blur(18px)'
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <HealthAndSafety sx={{ fontSize: 36, color: '#ffffff' }} />
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#ffffff' }}>
                      Diabetes Risk Assessment
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5, fontWeight: 600, letterSpacing: 0.3 }}>
                    🔍 Precision Analytics • 🎯 Clinical-Grade Insights • 💡 Actionable Next Steps
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1, display: 'block' }}>
                    📅 Generated on {new Date().toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    sx={{
                      background: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)',
                      color: '#0b172a',
                      fontWeight: 800,
                      borderRadius: 999,
                      px: 3,
                      boxShadow: '0 10px 30px rgba(56,189,248,0.35)',
                      '&:hover': { background: 'linear-gradient(135deg, #bae6fd 0%, #60a5fa 100%)' }
                    }}
                  >
                    Export
                  </Button>
                  <Tooltip title="Share Results">
                    <IconButton sx={{ color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)', '&:hover': { background: 'rgba(255,255,255,0.15)' } }}>
                      <Share />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
            <Card
              sx={{
                mb: 3,
                borderRadius: 4,
                overflow: 'hidden',
                background: getRiskGradient(risk_level),
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
                position: 'relative',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <Box sx={{ position: 'absolute', top: -80, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(8px)' }} />
              <Box sx={{ position: 'absolute', bottom: -50, left: -120, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(12px)' }} />

              <CardContent sx={{ p: { xs: 3.5, md: 4.5 }, position: 'relative', zIndex: 1 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                      <Box
                        sx={{
                          width: 120,
                          height: 120,
                          borderRadius: '50%',
                          background: 'linear-gradient(145deg, rgba(255,255,255,0.32), rgba(255,255,255,0.14))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '3px solid rgba(255,255,255,0.35)',
                          boxShadow: '0 18px 48px rgba(0,0,0,0.4)',
                          backdropFilter: 'blur(16px)'
                        }}
                      >
                        {getRiskIcon(risk_level)}
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.88)', fontWeight: 700, display: 'block', letterSpacing: 0.8 }}>
                          RISK LEVEL
                        </Typography>
                        <Typography variant="h2" sx={{ fontWeight: 900, color: '#ffffff', lineHeight: 1, letterSpacing: -0.8 }}>
                          {risk_level}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, display: 'block', letterSpacing: 0.7 }}>
                        PROBABILITY
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#ffffff', textShadow: '0 3px 20px rgba(0,0,0,0.4)', letterSpacing: -0.5 }}>
                        {Math.round(probability * 100)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={probability * 100}
                        sx={{
                          height: 7,
                          borderRadius: 4,
                          backgroundColor: 'rgba(255,255,255,0.25)',
                          mt: 1.8,
                          '& .MuiLinearProgress-bar': { backgroundColor: '#ffffff', borderRadius: 4, boxShadow: '0 0 12px rgba(255,255,255,0.5)' }
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, display: 'block', letterSpacing: 0.7 }}>
                        CONFIDENCE
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#ffffff', textShadow: '0 3px 20px rgba(0,0,0,0.4)', letterSpacing: -0.5 }}>
                        {Math.round(confidence * 100)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={confidence * 100}
                        sx={{
                          height: 7,
                          borderRadius: 4,
                          backgroundColor: 'rgba(255,255,255,0.25)',
                          mt: 1.8,
                          '& .MuiLinearProgress-bar': { backgroundColor: '#ffffff', borderRadius: 4, boxShadow: '0 0 12px rgba(255,255,255,0.5)' }
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                      <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={fetchAssessmentData}
                        sx={{
                          background: 'rgba(255,255,255,0.96)',
                          color: '#0f172a',
                          fontWeight: 800,
                          borderRadius: 999,
                          px: 3,
                          boxShadow: '0 16px 40px rgba(255,255,255,0.3)',
                          '&:hover': { background: 'white', boxShadow: '0 18px 48px rgba(255,255,255,0.35)' }
                        }}
                      >
                        Reassess
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<CheckCircle />}
                        sx={{
                          background: 'rgba(0,0,0,0.25)',
                          color: '#ffffff',
                          fontWeight: 800,
                          borderRadius: 999,
                          px: 3,
                          border: '1px solid rgba(255,255,255,0.4)',
                          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                          '&:hover': { background: 'rgba(255,255,255,0.15)', boxShadow: '0 14px 40px rgba(0,0,0,0.5)' }
                        }}
                      >
                        Proceed
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #0f4c75 0%, #1a5fa0 100%)',
                    borderRadius: 4,
                    height: '100%',
                    border: '1px solid rgba(100, 200, 255, 0.2)',
                    boxShadow: '0 16px 48px rgba(15, 76, 117, 0.4)',
                    backdropFilter: 'blur(12px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      boxShadow: '0 20px 60px rgba(15, 76, 117, 0.5)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: 'white', letterSpacing: -0.5 }}>
                        {symptoms_present.length}
                      </Typography>
                      <TrendingUp sx={{ color: '#64b5f6', fontSize: 32 }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1.5, fontWeight: 600 }}>
                      Symptoms Present
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(symptoms_present.length / 14) * 100}
                      sx={{
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        '& .MuiLinearProgress-bar': { backgroundColor: '#64b5f6', borderRadius: 3 }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', mt: 1.5, display: 'block', fontWeight: 600 }}>
                      Out of 14 tracked
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #0d5e3d 0%, #0f7d47 100%)',
                    borderRadius: 4,
                    height: '100%',
                    border: '1px solid rgba(110, 231, 183, 0.2)',
                    boxShadow: '0 16px 48px rgba(13, 94, 61, 0.4)',
                    backdropFilter: 'blur(12px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      boxShadow: '0 20px 60px rgba(13, 94, 61, 0.5)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: 'white', letterSpacing: -0.5 }}>
                        {recommendations.length}
                      </Typography>
                      <HealthAndSafety sx={{ color: '#6ee7b7', fontSize: 32 }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1.5, fontWeight: 600 }}>
                      Recommendations
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={100}
                      sx={{
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        '& .MuiLinearProgress-bar': { backgroundColor: '#6ee7b7', borderRadius: 3 }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', mt: 1.5, display: 'block', fontWeight: 600 }}>
                      Tailored guidance ready
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15 }}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #3730a3 0%, #5b21b6 100%)',
                    borderRadius: 4,
                    height: '100%',
                    border: '1px solid rgba(196, 181, 253, 0.2)',
                    boxShadow: '0 16px 48px rgba(55, 48, 163, 0.4)',
                    backdropFilter: 'blur(12px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      boxShadow: '0 20px 60px rgba(55, 48, 163, 0.5)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: 'white', letterSpacing: -0.5 }}>
                        {Math.round(confidence * 100)}%
                      </Typography>
                      <AssessmentIcon sx={{ color: '#c4b5fd', fontSize: 32 }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1.5, fontWeight: 600 }}>
                      Model Confidence
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={confidence * 100}
                      sx={{
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        '& .MuiLinearProgress-bar': { backgroundColor: '#c4b5fd', borderRadius: 3 }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', mt: 1.5, display: 'block', fontWeight: 600 }}>
                      Ensemble certainty
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #7c2d12 0%, #92400e 100%)',
                    borderRadius: 4,
                    height: '100%',
                    border: '1px solid rgba(251, 146, 60, 0.2)',
                    boxShadow: '0 16px 48px rgba(124, 45, 18, 0.4)',
                    backdropFilter: 'blur(12px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      boxShadow: '0 20px 60px rgba(124, 45, 18, 0.5)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 900, mb: 1.5, letterSpacing: -0.2 }}>
                      Next Best Step
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', mb: 2.5, minHeight: 44, fontWeight: 600 }}>
                      {next_steps[0] || 'Follow the recommended actions to proceed.'}
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        background: '#fff',
                        color: '#92400e',
                        fontWeight: 900,
                        borderRadius: 999,
                        py: 1.2,
                        boxShadow: '0 12px 28px rgba(255, 255, 255, 0.25)',
                        '&:hover': { background: '#f5f5f5' }
                      }}
                    >
                      View Actions
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.5 }}>
                <Card
                  sx={{
                    background: 'linear-gradient(150deg, rgba(15, 76, 117, 0.15) 0%, rgba(30, 144, 255, 0.08) 100%)',
                    border: '1.5px solid rgba(100, 181, 246, 0.15)',
                    borderRadius: 4,
                    height: '100%',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 8px 24px rgba(15, 76, 117, 0.25)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 48px rgba(15, 76, 117, 0.35)' }
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2.5, fontWeight: 800, textAlign: 'center', letterSpacing: 0.3 }}>
                      Risk Probability
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Chart options={gaugeOptions} series={gaugeSeries} type="radialBar" height={280} width="100%" />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={4}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.6 }}>
                <Card
                  sx={{
                    background: 'linear-gradient(150deg, rgba(13, 94, 61, 0.15) 0%, rgba(110, 231, 183, 0.08) 100%)',
                    border: '1.5px solid rgba(110, 231, 183, 0.15)',
                    borderRadius: 4,
                    height: '100%',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 8px 24px rgba(13, 94, 61, 0.25)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 48px rgba(13, 94, 61, 0.35)' }
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2.5, fontWeight: 800, textAlign: 'center', letterSpacing: 0.3 }}>
                      Symptoms Distribution
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Chart options={donutOptions} series={donutSeries} type="donut" height={280} width="100%" />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={4}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.7 }}>
                <Card
                  sx={{
                    background: 'linear-gradient(150deg, rgba(55, 48, 163, 0.15) 0%, rgba(196, 181, 253, 0.08) 100%)',
                    border: '1.5px solid rgba(196, 181, 253, 0.15)',
                    borderRadius: 4,
                    height: '100%',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 8px 24px rgba(55, 48, 163, 0.25)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 48px rgba(55, 48, 163, 0.35)' }
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2.5, fontWeight: 800, textAlign: 'center', letterSpacing: 0.3 }}>
                      Feature Importance
                    </Typography>
                    <Box sx={{ height: 280, overflow: 'hidden' }}>
                      <Chart options={barOptions} series={barSeries} type="bar" height={280} width="100%" />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {medical_reasoning && (
            <Grid container spacing={3} sx={{ mt: 2, mb: 3 }}>
              <Grid item xs={12}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.75 }}>
                  <Card
                    sx={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(14, 165, 233, 0.08) 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 4,
                      backdropFilter: 'blur(14px)',
                      boxShadow: '0 18px 46px rgba(0,0,0,0.38)'
                    }}
                  >
                    <CardContent sx={{ p: 3.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <HealthAndSafety sx={{ color: '#64b5f6', fontSize: 44, mr: 2.5 }} />
                        <Box>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 900, letterSpacing: 0.3 }}>
                            Clinical Assessment
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Professional diabetes risk evaluation
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ color: '#64b5f6', fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', letterSpacing: 0.4 }}>
                          📋 Assessment Details
                        </Typography>
                        <Paper sx={{ p: 2.5, background: 'linear-gradient(135deg, rgba(15, 76, 117, 0.15) 0%, rgba(30, 144, 255, 0.08) 100%)', border: '1px solid rgba(100, 181, 246, 0.2)', borderRadius: 3 }}>
                          <Typography variant="body2" sx={{ color: '#E0E0E0', lineHeight: 1.9, whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                            {medical_reasoning}
                          </Typography>
                        </Paper>
                      </Box>

                      {priority_symptoms && priority_symptoms.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" sx={{ color: '#fb923c', fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', letterSpacing: 0.3 }}>
                            <Warning sx={{ fontSize: 20, mr: 1.2 }} />
                            Key Concerns
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1.2 }}>
                            {priority_symptoms.map((symptom, idx) => (
                              <Chip
                                key={idx}
                                label={symptom}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(255, 152, 0, 0.25)',
                                  color: '#FFB74D',
                                  border: '1px solid rgba(255, 152, 0, 0.4)',
                                  fontWeight: 600
                                }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {clinical_actions && clinical_actions.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" sx={{ color: '#34d399', fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', letterSpacing: 0.2 }}>
                            <CheckCircle sx={{ fontSize: 20, mr: 1 }} />
                            Recommended Actions
                          </Typography>
                          <List dense sx={{ pl: 0 }}>
                            {clinical_actions.map((action, idx) => (
                              <ListItem key={idx} sx={{ py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <TrendingUp sx={{ color: '#4CAF50', fontSize: 18 }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={action}
                                  primaryTypographyProps={{ variant: 'body2', sx: { color: '#E0E0E0' } }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}

                      {urgency && (
                        <Box sx={{ p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                          <Typography variant="caption" sx={{ color: '#B0B0B0', display: 'block', mb: 1, fontWeight: 'bold' }}>
                            🚨 Urgency Level
                          </Typography>
                          <Chip
                            label={urgency.toUpperCase()}
                            sx={{
                              backgroundColor:
                                urgency === 'emergency' ? '#ef4444' : urgency === 'urgent' ? '#f97316' : urgency === 'soon' ? '#facc15' : '#22c55e',
                              color: '#0f172a',
                              fontWeight: 900,
                              fontSize: '0.85rem'
                            }}
                          />
                        </Box>
                      )}

                      {clinical_notes && (
                        <Box sx={{ mt: 3, p: 2, background: 'rgba(33, 150, 243, 0.05)', borderRadius: 2, border: '1px solid rgba(33, 150, 243, 0.2)' }}>
                          <Typography variant="caption" sx={{ color: '#64B5F6', display: 'block', mb: 1, fontWeight: 'bold' }}>
                            ℹ️ Additional Notes
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#B3E5FC' }}>
                            {clinical_notes}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            </Grid>
          )}

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}>
                <Card
                  sx={{
                    background: 'linear-gradient(150deg, rgba(13, 94, 61, 0.15) 0%, rgba(110, 231, 183, 0.08) 100%)',
                    border: '1.5px solid rgba(110, 231, 183, 0.15)',
                    borderRadius: 4,
                    height: '100%',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 12px 36px rgba(13, 94, 61, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 48px rgba(13, 94, 61, 0.4)' }
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 900, mb: 1.5, letterSpacing: 0.3 }}>
                        Present Symptoms
                      </Typography>
                      <Chip
                        label={`${symptoms_present.length} of 14 detected`}
                        sx={{ background: 'rgba(110, 231, 183, 0.25)', color: '#6ee7b7', border: '1px solid rgba(110, 231, 183, 0.4)', fontWeight: 800 }}
                      />
                    </Box>
                    {symptoms_present.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {symptoms_present.slice(0, 6).map((symptom, index) => (
                          <motion.div key={symptom} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 2.2,
                                borderRadius: 2.5,
                                background: 'rgba(110, 231, 183, 0.12)',
                                border: '1px solid rgba(110, 231, 183, 0.25)',
                                transition: 'all 0.2s ease',
                                '&:hover': { background: 'rgba(110, 231, 183, 0.18)', transform: 'translateX(4px)' }
                              }}
                            >
                              <CheckCircle sx={{ color: '#6ee7b7', fontSize: 20, mr: 2.5, flexShrink: 0 }} />
                              <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                                {symptom}
                              </Typography>
                            </Box>
                          </motion.div>
                        ))}
                        {symptoms_present.length > 6 && (
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mt: 1.5, fontWeight: 600, letterSpacing: 0.2 }}>
                            +{symptoms_present.length - 6} more symptoms
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 6 }}>
                        <CheckCircle sx={{ color: 'rgba(110, 231, 183, 0.4)', fontSize: 42, mb: 2 }} />
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 1, fontWeight: 700 }}>
                          No symptoms detected
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                          Great news! No diabetes symptoms were identified.
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }}>
                <Card
                  sx={{
                    background: 'linear-gradient(150deg, rgba(55, 48, 163, 0.15) 0%, rgba(196, 181, 253, 0.08) 100%)',
                    border: '1.5px solid rgba(196, 181, 253, 0.15)',
                    borderRadius: 4,
                    height: '100%',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 12px 36px rgba(55, 48, 163, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 48px rgba(55, 48, 163, 0.4)' }
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 900, mb: 1.5, letterSpacing: 0.3 }}>
                        Recommendations
                      </Typography>
                      <Chip
                        label={`${recommendations.length} personalized tips`}
                        sx={{ background: 'rgba(196, 181, 253, 0.25)', color: '#c4b5fd', border: '1px solid rgba(196, 181, 253, 0.4)', fontWeight: 800 }}
                      />
                    </Box>
                    {recommendations.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {recommendations.slice(0, 5).map((rec, index) => (
                          <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                p: 2.5,
                                borderRadius: 2.5,
                                background: 'rgba(196, 181, 253, 0.12)',
                                border: '1px solid rgba(196, 181, 253, 0.25)',
                                transition: 'all 0.2s ease',
                                '&:hover': { background: 'rgba(196, 181, 253, 0.18)', transform: 'translateX(4px)' }
                              }}
                            >
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #c4b5fd, #a78bfa)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mr: 2.5,
                                  mt: 0.3,
                                  flexShrink: 0,
                                  boxShadow: '0 8px 24px rgba(196, 181, 253, 0.4)'
                                }}
                              >
                                <Typography variant="caption" sx={{ color: '#4c1d95', fontWeight: 900, fontSize: '0.8rem' }}>
                                  {index + 1}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, lineHeight: 1.6 }}>
                                {rec}
                              </Typography>
                            </Box>
                          </motion.div>
                        ))}
                        {recommendations.length > 5 && (
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mt: 1.5, fontWeight: 600, letterSpacing: 0.2 }}>
                            +{recommendations.length - 5} more recommendations
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 6 }}>
                        <Info sx={{ color: 'rgba(196, 181, 253, 0.4)', fontSize: 42, mb: 2 }} />
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 1, fontWeight: 700 }}>
                          No specific recommendations
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                          Continue maintaining a healthy lifestyle and regular check-ups.
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Assessment;
