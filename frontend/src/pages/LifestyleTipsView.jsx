import React, { useState, useEffect } from 'react';
import { useDateFormat } from '../hooks/useDateFormat';
import { useParams, useNavigate } from 'react-router-dom';
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
  Checkbox,
  Collapse,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Grid,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance.js';

const categoryConfig = {
  sleep_hygiene: { icon: '💤', color: '#6366f1', name: 'Sleep Hygiene' },
  stress_management: { icon: '🧘', color: '#8b5cf6', name: 'Stress Management' },
  hydration: { icon: '💧', color: '#06b6d4', name: 'Hydration' },
  blood_sugar_monitoring: { icon: '📊', color: '#f59e0b', name: 'Blood Sugar Monitoring' },
  medication_adherence: { icon: '💊', color: '#10b981', name: 'Medication Adherence' },
  foot_care: { icon: '🦶', color: '#ec4899', name: 'Foot Care' },
  dental_health: { icon: '🪥', color: '#14b8a6', name: 'Dental Health' },
  social_support: { icon: '💝', color: '#f43f5e', name: 'Social Support' },
  nutrition: { icon: '🥗', color: '#84cc16', name: 'Nutrition' },
  activity: { icon: '🏃', color: '#06b6d4', name: 'Physical Activity' },
  monitoring: { icon: '📈', color: '#f59e0b', name: 'Health Monitoring' },
};

const PriorityChip = ({ priority }) => {
  const colors = {
    high: { bg: '#fee2e2', text: '#dc2626' },
    medium: { bg: '#fef3c7', text: '#d97706' },
    low: { bg: '#dbeafe', text: '#2563eb' },
  };

  const priorityKey = String(priority || 'medium').toLowerCase();
  const label = String(priority || 'medium').toUpperCase();

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        bgcolor: colors[priorityKey]?.bg || colors.medium.bg,
        color: colors[priorityKey]?.text || colors.medium.text,
        fontWeight: 600,
      }}
    />
  );
};

const LifestyleTipsView = ({ tips: propsTips, onBack: propsOnBack, onDelete: propsOnDelete }) => {
  const { formatDate } = useDateFormat();
  const { tipsId } = useParams();
  const navigate = useNavigate();
  const [tips, setTips] = useState(propsTips || null);
  const [loading, setLoading] = useState(!propsTips);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // If tips are provided via props, use them
    if (propsTips) {
      setTips(propsTips);
      setLoading(false);
      // Initialize expanded categories
      const expanded = {};
      const propsCategories = Array.isArray(propsTips.categories) ? propsTips.categories : [];
      propsCategories.forEach((cat, idx) => {
        expanded[idx] = true;
      });
      setExpandedCategories(expanded);
    } else if (tipsId) {
      // Otherwise fetch from API
      fetchTips();
    }
  }, [tipsId, propsTips]);

  const fetchTips = async () => {
    try {
      setLoading(true);
      // For now, we'll fetch from history - ideally we'd have a GET /:tipsId endpoint
      const response = await axiosInstance.get(`/lifestyle-tips/history?limit=100`);
      const historyList = Array.isArray(response.data.history) ? response.data.history : [];
      const found = historyList.find((h) => h?._id === tipsId);
      if (found) {
        setTips(found);
        // Initialize expanded categories
        const expanded = {};
        const foundCategories = Array.isArray(found.categories) ? found.categories : [];
        foundCategories.forEach((cat, idx) => {
          expanded[idx] = true;
        });
        setExpandedCategories(expanded);
      } else {
        setError('Tips not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tips');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (index) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleChecklistToggle = async (index, completed) => {
    try {
      setUpdating(true);
      const id = propsTips?._id || tipsId;
      await axiosInstance.put(`/lifestyle-tips/${id}/checklist`, {
        taskIndex: index,
        completed: !completed,
      });

      // Update local state
      setTips((prev) => {
        if (!prev) return prev;
        const dailyChecklist = Array.isArray(prev.daily_checklist) ? [...prev.daily_checklist] : [];
        if (!dailyChecklist[index]) return prev;
        dailyChecklist[index] = { ...dailyChecklist[index], completed: !completed };
        return { ...prev, daily_checklist: dailyChecklist };
      });
      setSuccess('Checklist item updated!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update checklist');
    } finally {
      setUpdating(false);
    }
  };

  const handleTipToggle = async (catIndex, tipIndex, completed) => {
    try {
      setUpdating(true);
      const id = propsTips?._id || tipsId;
      await axiosInstance.put(`/lifestyle-tips/${id}/category/${catIndex}/tip/${tipIndex}`, {
        completed: !completed,
      });

      // Update local state
      setTips((prev) => {
        if (!prev) return prev;
        const categories = Array.isArray(prev.categories) ? [...prev.categories] : [];
        const category = categories[catIndex];
        if (!category) return prev;
        const tipsList = Array.isArray(category.tips) ? [...category.tips] : [];
        if (!tipsList[tipIndex]) return prev;
        tipsList[tipIndex] = { ...tipsList[tipIndex], completed: !completed };
        categories[catIndex] = { ...category, tips: tipsList };
        return { ...prev, categories };
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update tip');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete these tips?')) return;

    try {
      const id = propsTips?._id || tipsId;
      
      if (propsOnDelete) {
        // Use callback provided via props
        await propsOnDelete(id);
      } else {
        // Default behavior - delete and navigate
        await axiosInstance.delete(`/lifestyle-tips/${id}`);
        setSuccess('Tips deleted successfully!');
        setTimeout(() => navigate('/personalized-suggestions/lifestyle-tips'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete tips');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tips) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Alert severity="error">{error || 'Tips not found'}</Alert>
        <Button onClick={() => propsOnBack ? propsOnBack() : navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  // Normalize potentially inconsistent backend shapes to avoid runtime crashes
  const categories = Array.isArray(tips.categories) ? tips.categories : [];
  const personalizedInsights = Array.isArray(tips.personalized_insights) ? tips.personalized_insights : [];
  const dailyChecklist = Array.isArray(tips.daily_checklist) ? tips.daily_checklist : [];
  const sources = Array.isArray(tips.sources) ? tips.sources : [];

  const totalTips = categories.reduce((sum, cat) => sum + (Array.isArray(cat?.tips) ? cat.tips.length : 0), 0);
  const completedTips = categories.reduce(
    (sum, cat) => sum + (Array.isArray(cat?.tips) ? cat.tips.filter((t) => t?.completed).length : 0),
    0
  );
  const checklistCompleted = dailyChecklist.filter((task) => task?.completed).length;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f8fafb',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
            p: 3,
            mb: 3,
            color: '#ffffff',
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton 
              onClick={() => propsOnBack ? propsOnBack() : navigate(-1)} 
              size="large"
              sx={{ color: '#ffffff' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box flex={1}>
              <Typography variant="h5" fontWeight={700}>
                Lifestyle Wellness Tips
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.95, mt: 0.5 }}>
                {formatDate(tips.target_date)}{' '}
                • {tips.region}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                }
              }}
            >
              Delete
            </Button>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Personalized Insights */}
        {personalizedInsights.length > 0 && (
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3, bgcolor: '#f8f5ff' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ color: '#667eea' }}>
                💡 Personalized Insights
              </Typography>
              <Stack spacing={1.5}>
                {personalizedInsights.map((insight, idx) => (
                  <Box 
                    key={idx}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(102, 126, 234, 0.05)',
                      borderLeft: '3px solid #667eea'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#1e293b' }}>
                      {insight}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Daily Checklist */}
        {dailyChecklist.length > 0 && (
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3, bgcolor: '#ffffff' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={3} sx={{ color: '#1e293b' }}>
                Daily Checklist
              </Typography>
              <Stack spacing={2}>
                {dailyChecklist.map((task, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: '#f8fafb',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#667eea',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)'
                      }
                    }}
                  >
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#1e293b', mb: 0.5 }}>
                      {task?.task || ''}
                    </Typography>
                    {task?.time_of_day && (
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                        🕒 {task.time_of_day}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Categories */}
        {categories.map((category, catIdx) => (
          <Card key={catIdx} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, bgcolor: '#ffffff' }}>
            <CardContent sx={{ p: 3 }}>
              {(() => {
                const categoryName = typeof category?.name === 'string' && category.name.trim() ? category.name : 'general';
                const tipsList = Array.isArray(category?.tips) ? category.tips : [];
                const color = categoryConfig[categoryName]?.color || '#667eea';
                const icon = categoryConfig[categoryName]?.icon || '📝';
                const displayName =
                  categoryConfig[categoryName]?.name ||
                  String(categoryName)
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                return (
                  <>
                    <Box
                      onClick={() => toggleCategory(catIdx)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        pb: expandedCategories[catIdx] ? 2 : 0,
                        borderBottom: expandedCategories[catIdx] ? '1px solid #e2e8f0' : 'none',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b' }}>
                          {icon} {displayName}
                        </Typography>
                        <Chip
                          label={`${tipsList.length} tips`}
                          size="small"
                          sx={{
                            bgcolor: `${color}20`,
                            color: color,
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                      <ExpandMoreIcon
                        sx={{
                          transform: expandedCategories[catIdx] ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease',
                          color: '#64748b'
                        }}
                      />
                    </Box>

                    <Collapse in={expandedCategories[catIdx]}>
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        {tipsList.map((tip, tipIdx) => (
                          <Box
                            key={tipIdx}
                            sx={{
                              p: 2.5,
                              borderRadius: 2,
                              bgcolor: '#f8fafb',
                              border: '1px solid #e2e8f0',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderColor: color,
                                boxShadow: `0 4px 12px ${color}25`,
                              }
                            }}
                          >
                            <Typography
                              variant="body1"
                              fontWeight={600}
                              sx={{ color: '#1e293b', mb: 1 }}
                            >
                              {tip?.title || ''}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                              {tip?.description || ''}
                            </Typography>
                            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                              <PriorityChip priority={tip?.priority || 'medium'} />
                              {tip?.actionable && (
                                <Chip
                                  label="Actionable"
                                  size="small"
                                  sx={{
                                    bgcolor: `${color}15`,
                                    color: color,
                                    fontWeight: 600,
                                    fontSize: '0.75rem'
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </Collapse>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        ))}

        {/* Sources */}
        {sources.length > 0 && (
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3, bgcolor: '#ffffff' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={3} sx={{ color: '#1e293b' }}>
                📚 Sources Used
              </Typography>
              <Stack spacing={1.5}>
                {sources.map((source, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#f8fafb',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b' }}>
                      {source?.title || ''}
                    </Typography>
                    {source?.country && (
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {source.country}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default LifestyleTipsView;
