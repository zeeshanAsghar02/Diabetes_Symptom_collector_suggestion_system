import React, { useState, useEffect } from 'react';
import { useDateFormat } from '../hooks/useDateFormat';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Card,
  CardContent,
  Button,
  Stack,
  Typography,
  Chip,
  Alert,
  Dialog,
} from '@mui/material';
import { Refresh as RefreshIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance.js';
import LifestyleTipsView from './LifestyleTipsView.jsx';
import AIGenerationLoader from '../components/loaders/AIGenerationLoader.jsx';

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

  useEffect(() => {
    initializeLifestyleTips();
  }, []);

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
      setError(null);

      const response = await axiosInstance.post('/lifestyle-tips/auto-generate');
      setTodayTips(response.data.tips);
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
      setError(null);

      const response = await axiosInstance.get('/lifestyle-tips/current');
      setTodayTips(response.data.tips);
      if (!response.data.tips) {
        await autoGenerateTips();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refresh tips');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading || generating) {
    return <AIGenerationLoader message="Generating your personalized lifestyle tips..." />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafb', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
            p: 4,
            mb: 3,
            color: '#ffffff',
            border: '1px solid #e2e8f0',
          }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                Lifestyle Wellness Coach
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.95, mb: 2 }}>
                Daily habits and personalized tips for better diabetes management
              </Typography>
              {todayTips && (
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  <Chip
                    label={new Date(todayTips.target_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  <Chip
                    label={todayTips.region}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  <Chip
                    label={`${todayTips.categories?.length || 0} Categories`}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                    }}
                  />
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
                  fontWeight: 600,
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.5)',
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: '#ffffff',
                    bgcolor: 'rgba(255,255,255,0.15)',
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
                    fontWeight: 600,
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.5)',
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: '#ff6b6b',
                      bgcolor: 'rgba(255,107,107,0.15)',
                    },
                  }}
                >
                  {clearing ? 'Clearing...' : 'Clear Today\'s Tips'}
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {todayTips ? (
          <LifestyleTipsView tips={todayTips} />
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: 3,
              textAlign: 'center',
              border: '2px dashed #cbd5e1',
              bgcolor: '#ffffff',
            }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', mb: 1 }}>
              No tips for today yet
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              Click refresh to generate your personalized wellness tips
            </Typography>
            <Button
              variant="contained"
              onClick={handleRefresh}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                px: 4,
                py: 1.2,
              }}
            >
              Generate Tips
            </Button>
          </Paper>
        )}

        {/* Recent History */}
        {history.length > 0 && (
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={3} sx={{ color: '#1e293b' }}>
                Recent Tips History
              </Typography>
              <Stack spacing={2}>
                {history.slice(0, 5).map((tips, idx) => {
                  const categories = Array.isArray(tips?.categories) ? tips.categories : [];
                  const total = categories.reduce((sum, cat) => sum + (cat?.tips?.length || 0), 0);

                  return (
                    <Box
                      key={idx}
                      onClick={() => setViewingHistoryTips(tips)}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        cursor: 'pointer',
                        bgcolor: '#f8fafb',
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          borderColor: '#667eea', 
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                          transform: 'translateY(-2px)'
                        },
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>
                            {formatDate(tips.target_date)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                            {tips.region}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${total} tips`} 
                          sx={{
                            bgcolor: '#667eea',
                            color: '#ffffff',
                            fontWeight: 600
                          }}
                        />
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
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
            bgcolor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1300,
          }}
          onClick={() => setShowGenerator(false)}
        >
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              maxWidth: 400,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" fontWeight={700} mb={2}>
              Generate Lifestyle Tips
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Select a date for your lifestyle tips:
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mb={3}>
              {generateDateOptions().map((d) => (
                <Chip
                  key={d}
                  label={formatDate(d, 'DD MMMM')}
                  color={selectedDate === d ? 'primary' : 'default'}
                  onClick={() => setSelectedDate(d)}
                  clickable
                  sx={{ fontWeight: selectedDate === d ? 'bold' : 'normal' }}
                />
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
              <Button fullWidth variant="outlined" onClick={() => setShowGenerator(false)}>
                Cancel
              </Button>
            </Stack>
          </Paper>
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
            borderRadius: 3,
            maxHeight: '90vh'
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

