import React, { useState, useEffect } from 'react';
import { useDateFormat } from '../hooks/useDateFormat';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Button,
  Stack,
  Typography,
  Alert,
  Dialog,
  DialogContent,
} from '@mui/material';
import { Refresh as RefreshIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance.js';
import LifestyleTipsView from './LifestyleTipsView.jsx';

const LIFESTYLE_SYNTHESIS_STAGES = [
  { id: 1, label: 'Fetching profile context', duration: 12 },
  { id: 2, label: 'Reading medical constraints', duration: 18 },
  { id: 3, label: 'Retrieving diabetes guidance', duration: 30 },
  { id: 4, label: 'Compiling lifestyle categories', duration: 45 },
  { id: 5, label: 'Personalizing daily habits', duration: 45 },
  { id: 6, label: 'Checking safety and clarity', duration: 24 },
  { id: 7, label: 'Finalizing lifestyle recommendations', duration: 18 },
];

const LifestyleSynthesisLoader = ({ elapsedSeconds = 0, complete = false }) => {
  const totalStageSeconds = LIFESTYLE_SYNTHESIS_STAGES.reduce((sum, stage) => sum + stage.duration, 0);
  const progress = complete ? 100 : Math.min(99, Math.max(0, Math.round((elapsedSeconds / totalStageSeconds) * 100)));
  let accumulatedSeconds = 0;
  const activeStageIndex = LIFESTYLE_SYNTHESIS_STAGES.findIndex((stage) => {
    accumulatedSeconds += stage.duration;
    return elapsedSeconds < accumulatedSeconds;
  });
  const currentStageIndex = complete
    ? LIFESTYLE_SYNTHESIS_STAGES.length
    : activeStageIndex === -1
      ? LIFESTYLE_SYNTHESIS_STAGES.length - 1
      : activeStageIndex;

  return (
    <Dialog
      open
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1.5,
          bgcolor: '#0f1420',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 28px 90px rgba(2,6,23,0.62)',
        },
      }}
    >
      <DialogContent sx={{ px: 3.5, py: 3.5 }}>
        <Typography variant="h5" fontWeight={520} sx={{ color: '#fff', letterSpacing: '-0.045em', mb: 2.2 }}>
          AI Lifestyle Synthesis
        </Typography>
        <Typography sx={{ color: 'rgba(203,213,225,0.72)', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', mb: 0.8 }}>
          Lifestyle Engine:{' '}
          <Box component="span" sx={{ color: '#67e8f9', fontFamily: 'JetBrains Mono, Roboto Mono, monospace', fontWeight: 500 }}>
            {progress}%
          </Box>
        </Typography>
        <Box
          sx={{
            height: 2,
            width: '100%',
            borderRadius: 999,
            overflow: 'hidden',
            bgcolor: 'rgba(255,255,255,0.07)',
            position: 'relative',
            mb: 4,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #22d3ee, #34d399)',
              boxShadow: '0 0 22px rgba(34,211,238,0.32)',
              transition: 'width 0.5s cubic-bezier(0.1, 0.76, 0.55, 0.94)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.75), rgba(52,211,153,0.75), transparent)',
              animation: 'lifestyleSynthesisWave 1.7s ease-in-out infinite',
            },
            '@keyframes lifestyleSynthesisWave': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' },
            },
          }}
        />
        <Stack spacing={1.55}>
          {LIFESTYLE_SYNTHESIS_STAGES.map((stage, index) => {
            const completed = index < currentStageIndex;
            const active = !complete && index === currentStageIndex;
            return (
              <Box key={stage.id} sx={{ display: 'grid', gridTemplateColumns: '26px 1fr', alignItems: 'center', columnGap: 1.4 }}>
                <Box sx={{ width: 22, height: 22, display: 'grid', placeItems: 'center', fontFamily: 'JetBrains Mono, Roboto Mono, monospace', fontSize: active ? 16 : 12, color: completed ? '#2dd4bf' : active ? '#67e8f9' : 'rgba(148,163,184,0.38)' }}>
                  {completed ? '✓' : active ? (
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#67e8f9', boxShadow: '0 0 18px rgba(103,232,249,0.62)', animation: 'lifestylePipelinePulse 1s ease-in-out infinite', '@keyframes lifestylePipelinePulse': { '0%, 100%': { opacity: 0.45, transform: 'scale(0.75)' }, '50%': { opacity: 1, transform: 'scale(1.18)' } } }} />
                  ) : String(stage.id).padStart(2, '0')}
                </Box>
                <Typography sx={{ fontSize: { xs: 13, md: 14 }, fontWeight: active ? 520 : 430, color: completed ? 'rgba(226,232,240,0.9)' : active ? '#fff' : 'rgba(148,163,184,0.4)' }}>
                  {stage.label}
                  {active && <Box component="span" sx={{ color: '#67e8f9', ml: 0.8, letterSpacing: '0.14em' }}>...</Box>}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

const LifestyleTipsDashboard = ({ inModal = false }) => {
  const { formatDate } = useDateFormat();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [todayTips, setTodayTips] = useState(null);
  const [history, setHistory] = useState([]);
  const [viewingHistoryTips, setViewingHistoryTips] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [synthesisSeconds, setSynthesisSeconds] = useState(0);
  const [synthesisComplete, setSynthesisComplete] = useState(false);

  useEffect(() => {
    initializeLifestyleTips();
  }, []);

  useEffect(() => {
    if (!generating && !refreshing) {
      setSynthesisSeconds(0);
      setSynthesisComplete(false);
      return undefined;
    }
    const interval = setInterval(() => setSynthesisSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [generating, refreshing]);

  const fetchHistory = async (limit = 30) => {
    try {
      const res = await axiosInstance.get(`/lifestyle-tips/history?limit=${limit}`);
      const list = Array.isArray(res.data.history) ? res.data.history : [];
      setHistory(list);
    } catch (err) {
      console.warn('Could not load lifestyle tips history:', err);
      setHistory([]);
    }
  };

  // Used by the history dialog delete callback
  const fetchInitial = async () => {
    await fetchHistory(30);
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i <= 5; i++) {
      const d = new Date(today.getTime() + (i * 24 * 60 * 60 * 1000));
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    return dates;
  };

  const handleGenerateTips = async () => {
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    try {
      setGenerating(true);
      setSynthesisComplete(false);
      setError(null);
      const res = await axiosInstance.post('/lifestyle-tips/generate', { target_date: selectedDate });
      if (res.data?.success) {
        setTodayTips(res.data.tips);
        setShowGenerator(false);
        setSelectedDate(null);
        await fetchHistory(30);
        setSuccess('Lifestyle tips generated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
      setSynthesisComplete(true);
      await new Promise((resolve) => setTimeout(resolve, 450));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate lifestyle tips');
    } finally {
      setGenerating(false);
    }
  };

  const initializeLifestyleTips = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch today's tips
      try {
        const response = await axiosInstance.get('/lifestyle-tips/current');
        setTodayTips(response.data.tips);
        if (!response.data.tips) {
          // Backend returns 200 with tips:null when none exist
          await autoGenerateTips();
        }
      } catch (err) {
        // If no tips exist, auto-generate
        if (err.response?.status === 404 || err.response?.data?.message?.includes('not found')) {
          await autoGenerateTips();
        } else {
          throw err;
        }
      }

      // History is non-blocking; keep page usable even if it fails
      await fetchHistory(30);
    } catch (err) {
      console.error('Initialize error:', err);
      setError(err.response?.data?.message || 'Failed to load lifestyle tips. Please ensure LM Studio is running.');
    } finally {
      setLoading(false);
    }
  };

  const autoGenerateTips = async () => {
    try {
      setGenerating(true);
      setSynthesisComplete(false);
      setError(null);

      const response = await axiosInstance.post('/lifestyle-tips/auto-generate');
      setTodayTips(response.data.tips);
      setSynthesisComplete(true);
      await new Promise((resolve) => setTimeout(resolve, 450));
    } catch (err) {
      console.error('Auto-generate error:', err);
      setError(err.response?.data?.message || 'AI generator is unavailable or timed out. Please ensure LM Studio is running.');
    } finally {
      setGenerating(false);
    }
  };

  const clearTodaysTips = async () => {
    if (!window.confirm('Are you sure you want to delete today\'s lifestyle tips? This cannot be undone.')) {
      return;
    }
    
    setClearing(true);
    setError(null);
    try {
      const response = await axiosInstance.delete('/dev/clear-today-tips');
      if (response.data.success) {
        setSuccess(`Deleted ${response.data.deletedCount} tip(s). Refreshing...`);
        setTodayTips(null);
        
        // Refresh after 1 second
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      setError('Failed to clear tips: ' + (err.response?.data?.error || err.message));
    } finally {
      setClearing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setSynthesisComplete(false);
      setError(null);

      const response = await axiosInstance.get('/lifestyle-tips/current');
      setTodayTips(response.data.tips);
      if (!response.data.tips) {
        await autoGenerateTips();
      }
      setSynthesisComplete(true);
      await new Promise((resolve) => setTimeout(resolve, 450));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refresh tips');
    } finally {
      setRefreshing(false);
    }
  };

  if (generating || refreshing) {
    return <LifestyleSynthesisLoader elapsedSeconds={synthesisSeconds} complete={synthesisComplete} />;
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#090d16', display: 'grid', placeItems: 'center' }}>
        <Box sx={{ width: 160, height: 1, bgcolor: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative', '&::after': { content: '""', position: 'absolute', inset: 0, width: '45%', background: 'linear-gradient(90deg, transparent, #22d3ee, transparent)', animation: 'lifestyleBoot 1.3s ease-in-out infinite' }, '@keyframes lifestyleBoot': { '0%': { transform: 'translateX(-110%)' }, '100%': { transform: 'translateX(230%)' } } }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#090d16', py: 4, color: '#fff' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            pb: 3,
          }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            justifyContent="space-between"
          >
            <Box>
              <Typography sx={{ color: '#67e8f9', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', mb: 1 }}>
                Personalized Care Engine
              </Typography>
              <Typography variant="h4" fontWeight={540} sx={{ mb: 1, color: '#fff', letterSpacing: '-0.045em' }}>
                Lifestyle Wellness Coach
              </Typography>
              {todayTips && (
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {[new Date(todayTips.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), `${todayTips.categories?.length || 0} categories`].map((label) => (
                    <Typography key={label} sx={{ color: 'rgba(203,213,225,0.68)', fontSize: 12, fontFamily: 'JetBrains Mono, Roboto Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {label}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing || clearing}
                sx={{
                  textTransform: 'none',
                  fontWeight: 520,
                  color: '#ffffff',
                  borderColor: 'rgba(34,211,238,0.28)',
                  borderRadius: 1.5,
                  bgcolor: 'rgba(15,20,32,0.72)',
                  '&:hover': {
                    borderColor: 'rgba(34,211,238,0.55)',
                    bgcolor: 'rgba(34,211,238,0.08)',
                  },
                }}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              {todayTips && (
                <Button
                  variant="outlined"
                  size="large"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={clearTodaysTips}
                  disabled={clearing || refreshing}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 520,
                    color: 'rgba(248,113,113,0.88)',
                    borderColor: 'rgba(248,113,113,0.22)',
                    borderRadius: 1.5,
                    bgcolor: 'rgba(15,20,32,0.72)',
                    '&:hover': {
                      borderColor: 'rgba(248,113,113,0.55)',
                      bgcolor: 'rgba(248,113,113,0.08)',
                    },
                  }}
                >
                  {clearing ? 'Clearing...' : 'Clear Today\'s Tips'}
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1.5, bgcolor: 'rgba(127,29,29,0.22)', color: '#fecaca', border: '1px solid rgba(248,113,113,0.18)' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 1.5, bgcolor: 'rgba(6,78,59,0.22)', color: '#bbf7d0', border: '1px solid rgba(52,211,153,0.18)' }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {todayTips ? (
          <LifestyleTipsView tips={todayTips} />
        ) : (
          <Box
            sx={{
              py: 7,
              borderTop: '1px solid rgba(255,255,255,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Typography variant="h6" fontWeight={520} sx={{ color: '#fff', mb: 1, letterSpacing: '-0.02em' }}>
              No tips for today yet
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3 }}>
              Generate a fresh lifestyle set from your current profile context.
            </Typography>
            <Button
              variant="outlined"
              onClick={handleRefresh}
              sx={{
                textTransform: 'none',
                fontWeight: 520,
                color: '#fff',
                borderColor: 'rgba(34,211,238,0.3)',
                borderRadius: 1.5,
                px: 4,
                py: 1.2,
                '&:hover': { borderColor: 'rgba(34,211,238,0.62)', bgcolor: 'rgba(34,211,238,0.08)' },
              }}
            >
              Generate Tips
            </Button>
          </Box>
        )}

        {/* Recent History */}
        {history.length > 0 && (
          <Box sx={{ mt: 5 }}>
              <Typography variant="h6" fontWeight={520} mb={3} sx={{ color: '#fff', letterSpacing: '-0.02em' }}>
                Recent Tips History
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {history.slice(0, 5).map((tips, idx) => {
                  const categories = Array.isArray(tips?.categories) ? tips.categories : [];
                  const total = categories.reduce((sum, cat) => sum + (cat?.tips?.length || 0), 0);

                  return (
                    <Box
                      key={idx}
                      onClick={() => setViewingHistoryTips(tips)}
                      sx={{
                        py: 2.8,
                        px: 2,
                        cursor: 'pointer',
                        borderLeft: idx === 0 ? 0 : '1px solid rgba(255,255,255,0.05)',
                        transition: 'all 0.25s ease',
                        '&:hover': { 
                          bgcolor: 'rgba(255,255,255,0.025)',
                        },
                      }}
                    >
                          <Typography fontWeight={520} sx={{ color: '#fff', mb: 0.8, fontSize: 14 }}>
                            {formatDate(tips.target_date)}
                          </Typography>
                          <Typography sx={{ color: '#67e8f9', fontWeight: 430, fontSize: 13, fontFamily: 'JetBrains Mono, Roboto Mono, monospace' }}>
                            {total} tips
                          </Typography>
                    </Box>
                  );
                })}
              </Box>
          </Box>
        )}
      </Container>

      {/* Generate Modal */}
      {showGenerator && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(2,6,23,0.72)',
            backdropFilter: 'blur(14px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1300,
          }}
          onClick={() => setShowGenerator(false)}
        >
          <Box
            sx={{
              p: 3,
              borderRadius: 1.5,
              maxWidth: 400,
              width: '90%',
              bgcolor: '#0f1420',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" fontWeight={520} mb={1} sx={{ color: '#fff' }}>
              Generate Lifestyle Tips
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af' }} mb={2}>
              Select a date for your lifestyle tips:
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mb={3}>
              {generateDateOptions().map((d) => (
                <Button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  sx={{
                    color: selectedDate === d ? '#fff' : 'rgba(203,213,225,0.62)',
                    borderBottom: selectedDate === d ? '1px solid rgba(34,211,238,0.7)' : '1px solid transparent',
                    borderRadius: 0,
                    minWidth: 0,
                    px: 0.5,
                    textTransform: 'none',
                    fontWeight: 430,
                    '&:hover': { color: '#fff', bgcolor: 'transparent', borderBottomColor: 'rgba(34,211,238,0.35)' },
                  }}
                >
                  {formatDate(d, 'DD MMMM')}
                </Button>
              ))}
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleGenerateTips}
                disabled={generating}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              >
                {generating ? 'Generating...' : 'Generate'}
              </Button>
              <Button fullWidth variant="outlined" onClick={() => setShowGenerator(false)} sx={{ color: '#cbd5e1', borderColor: 'rgba(255,255,255,0.1)' }}>
                Cancel
              </Button>
            </Stack>
          </Box>
        </Box>
      )}

      {/* History Tips View Dialog */}
      <Dialog
        open={Boolean(viewingHistoryTips)}
        onClose={() => setViewingHistoryTips(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1.5,
            maxHeight: '90vh',
            bgcolor: '#090d16',
            border: '1px solid rgba(255,255,255,0.08)',
          }
        }}
      >
        {viewingHistoryTips && (
          <LifestyleTipsView
            tips={viewingHistoryTips}
            onBack={() => setViewingHistoryTips(null)}
            onDelete={async (id) => {
              try {
                await axiosInstance.delete(`/lifestyle-tips/${id}`);
                setViewingHistoryTips(null);
                fetchInitial();
              } catch (err) {
                console.error('Error deleting tips:', err);
              }
            }}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default LifestyleTipsDashboard;

