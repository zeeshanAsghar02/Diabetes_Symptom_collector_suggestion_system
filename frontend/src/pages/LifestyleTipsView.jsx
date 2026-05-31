import React, { useEffect, useState } from 'react';
import { useDateFormat } from '../hooks/useDateFormat';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Container,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance.js';

const categoryConfig = {
  sleep_hygiene: { color: '#6366f1', name: 'Sleep Hygiene' },
  stress_management: { color: '#8b5cf6', name: 'Stress Management' },
  hydration: { color: '#06b6d4', name: 'Hydration' },
  blood_sugar_monitoring: { color: '#f59e0b', name: 'Blood Sugar Monitoring' },
  medication_adherence: { color: '#10b981', name: 'Medication Adherence' },
  foot_care: { color: '#ec4899', name: 'Foot Care' },
  dental_health: { color: '#14b8a6', name: 'Dental Health' },
  social_support: { color: '#f43f5e', name: 'Social Support' },
  nutrition: { color: '#84cc16', name: 'Nutrition' },
  activity: { color: '#06b6d4', name: 'Physical Activity' },
  monitoring: { color: '#f59e0b', name: 'Health Monitoring' },
};

const getCategoryMeta = (categoryName) => {
  const normalizedName = typeof categoryName === 'string' && categoryName.trim() ? categoryName : 'general';
  const displayName =
    categoryConfig[normalizedName]?.name ||
    String(normalizedName)
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  return {
    name: normalizedName,
    displayName,
    color: categoryConfig[normalizedName]?.color || '#67e8f9',
  };
};

const PriorityReadout = ({ priority }) => {
  const normalized = String(priority || 'medium').toLowerCase();
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  const colorByPriority = {
    high: '#fb7185',
    medium: '#fbbf24',
    low: '#67e8f9',
  };
  const color = colorByPriority[normalized] || colorByPriority.medium;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.7,
        color,
        fontFamily: 'JetBrains Mono, Roboto Mono, monospace',
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 12px ${color}` }} />
      Priority: {label}
    </Box>
  );
};

const getInsightLabel = (text) => {
  const value = String(text || '').toLowerCase();
  if (value.includes('sleep')) return 'Sleep';
  if (value.includes('stress')) return 'Stress';
  if (value.includes('activity') || value.includes('exercise') || value.includes('walk') || value.includes('movement')) return 'Movement';
  if (value.includes('nutrition') || value.includes('diet') || value.includes('meal')) return 'Nutrition';
  if (value.includes('smoke') || value.includes('alcohol') || value.includes('habit')) return 'Habit';
  return 'Focus';
};

const condenseInsight = (text) => {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] || cleaned;
  return firstSentence.length > 118 ? `${firstSentence.slice(0, 115).trim()}...` : firstSentence;
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
    if (propsTips) {
      setTips(propsTips);
      setLoading(false);
      const expanded = {};
      const propsCategories = Array.isArray(propsTips.categories) ? propsTips.categories : [];
      propsCategories.forEach((_, idx) => {
        expanded[idx] = true;
      });
      setExpandedCategories(expanded);
    } else if (tipsId) {
      fetchTips();
    }
  }, [tipsId, propsTips]);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/lifestyle-tips/history?limit=100');
      const historyList = Array.isArray(response.data.history) ? response.data.history : [];
      const found = historyList.find((h) => h?._id === tipsId);
      if (found) {
        setTips(found);
        const expanded = {};
        const foundCategories = Array.isArray(found.categories) ? found.categories : [];
        foundCategories.forEach((_, idx) => {
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

      setTips((prev) => {
        if (!prev) return prev;
        const dailyChecklist = Array.isArray(prev.daily_checklist) ? [...prev.daily_checklist] : [];
        if (!dailyChecklist[index]) return prev;
        dailyChecklist[index] = { ...dailyChecklist[index], completed: !completed };
        return { ...prev, daily_checklist: dailyChecklist };
      });
      setSuccess('Checklist item updated');
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
        await propsOnDelete(id);
      } else {
        await axiosInstance.delete(`/lifestyle-tips/${id}`);
        setSuccess('Tips deleted successfully');
        setTimeout(() => navigate('/personalized-suggestions/lifestyle-tips'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete tips');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', bgcolor: '#090d16' }}>
        <CircularProgress size={24} sx={{ color: '#22d3ee' }} />
      </Box>
    );
  }

  if (!tips) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#090d16', py: 5 }}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ bgcolor: 'rgba(127,29,29,0.22)', color: '#fecaca', border: '1px solid rgba(248,113,113,0.18)' }}>
            {error || 'Tips not found'}
          </Alert>
          <Button onClick={() => (propsOnBack ? propsOnBack() : navigate(-1))} sx={{ mt: 2, color: '#67e8f9' }}>
            Go Back
          </Button>
        </Container>
      </Box>
    );
  }

  const categories = Array.isArray(tips.categories) ? tips.categories : [];
  const personalizedInsights = Array.isArray(tips.personalized_insights) ? tips.personalized_insights : [];
  const dailyChecklist = Array.isArray(tips.daily_checklist) ? tips.daily_checklist : [];
  const sources = Array.isArray(tips.sources) ? tips.sources : [];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#090d16', py: 4, color: '#fff' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>
        <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton
              onClick={() => (propsOnBack ? propsOnBack() : navigate(-1))}
              size="large"
              sx={{ color: '#cbd5e1', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.04)' } }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box flex={1}>
              <Typography variant="h5" fontWeight={520} sx={{ color: '#fff', letterSpacing: '-0.035em' }}>
                Lifestyle Wellness Tips
              </Typography>
              <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5, fontFamily: 'JetBrains Mono, Roboto Mono, monospace', fontSize: 12 }}>
                {formatDate(tips.target_date)}
              </Typography>
            </Box>
            <Button
              variant="text"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              sx={{
                color: 'rgba(248,113,113,0.72)',
                fontWeight: 520,
                textTransform: 'none',
                '&:hover': { color: '#fb7185', bgcolor: 'rgba(248,113,113,0.08)' },
              }}
            >
              Delete
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5, bgcolor: 'rgba(127,29,29,0.22)', color: '#fecaca', border: '1px solid rgba(248,113,113,0.18)' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5, bgcolor: 'rgba(6,78,59,0.22)', color: '#bbf7d0', border: '1px solid rgba(52,211,153,0.18)' }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {personalizedInsights.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={520} mb={2} sx={{ color: '#fff', letterSpacing: '-0.02em' }}>
              Personalized Insights
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                borderTop: '1px solid rgba(255,255,255,0.04)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {personalizedInsights.slice(0, 3).map((insight, idx) => {
                const label = getInsightLabel(insight);
                return (
                <Box
                  key={idx}
                  sx={{
                    py: 2,
                    px: { xs: 0, md: 2 },
                    borderLeft: { xs: 0, md: idx === 0 ? 0 : '1px solid rgba(255,255,255,0.04)' },
                  }}
                >
                  <Typography sx={{ color: '#fff', fontWeight: 520, fontSize: 13, lineHeight: 1.6, letterSpacing: '-0.01em' }}>
                    {label}:{' '}
                    <Box component="span" sx={{ color: '#9ca3af', fontWeight: 400 }}>
                      {condenseInsight(insight)}
                    </Box>
                  </Typography>
                </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {dailyChecklist.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={520} mb={2} sx={{ color: '#fff', letterSpacing: '-0.02em' }}>
              Daily Checklist
            </Typography>
            <Stack sx={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {dailyChecklist.map((task, idx) => (
                <Box
                  key={idx}
                  onClick={() => handleChecklistToggle(idx, task?.completed)}
                  sx={{
                    py: 1.7,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: updating ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: task?.completed ? 0.56 : 1,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                  }}
                >
                  <Typography variant="body1" fontWeight={520} sx={{ color: '#fff', mb: 0.5 }}>
                    {task?.task || ''}
                  </Typography>
                  {task?.time_of_day && (
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontFamily: 'JetBrains Mono, Roboto Mono, monospace' }}>
                      {task.time_of_day}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {categories.map((category, catIdx) => {
          const tipsList = Array.isArray(category?.tips) ? category.tips : [];
          const meta = getCategoryMeta(category?.name);

          return (
            <Box key={catIdx} sx={{ mb: 2.2 }}>
              <Box
                onClick={() => toggleCategory(catIdx)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  px: 2.2,
                  py: 1.65,
                  borderRadius: 1.5,
                  bgcolor: '#161e2e',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.25s ease',
                  '&:hover': { bgcolor: 'rgba(30,41,59,0.86)' },
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6" fontWeight={500} sx={{ color: '#fff', letterSpacing: '-0.018em' }}>
                    {meta.displayName}
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.7,
                      color: meta.color,
                      fontFamily: 'JetBrains Mono, Roboto Mono, monospace',
                      fontSize: 11,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: meta.color, boxShadow: `0 0 12px ${meta.color}` }} />
                    {tipsList.length} tips
                  </Box>
                </Box>
                <ExpandMoreIcon
                  sx={{
                    transform: expandedCategories[catIdx] ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    color: 'rgba(255,255,255,0.78)',
                  }}
                />
              </Box>

              <Collapse in={expandedCategories[catIdx]}>
                <Stack sx={{ mt: 1.4, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  {tipsList.map((tip, tipIdx) => (
                    <Box
                      key={tipIdx}
                      onClick={() => handleTipToggle(catIdx, tipIdx, tip?.completed)}
                      sx={{
                        py: 2.2,
                        px: 0.5,
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: updating ? 'wait' : 'pointer',
                        opacity: tip?.completed ? 0.58 : 1,
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.018)' },
                      }}
                    >
                      <Typography variant="body1" fontWeight={520} sx={{ color: '#fff', mb: 1, letterSpacing: '-0.01em' }}>
                        {tip?.title || ''}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2, lineHeight: 1.75 }}>
                        {tip?.description || ''}
                      </Typography>
                      <Box display="flex" gap={1.4} alignItems="center" flexWrap="wrap">
                        <PriorityReadout priority={tip?.priority || 'medium'} />
                        {tip?.actionable && (
                          <Box sx={{ color: meta.color, fontFamily: 'JetBrains Mono, Roboto Mono, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            Actionable
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Collapse>
            </Box>
          );
        })}

        {sources.length > 0 && (
          <Box sx={{ mt: 5, mb: 3 }}>
            <Typography variant="h6" fontWeight={520} mb={2} sx={{ color: '#fff', letterSpacing: '-0.02em' }}>
              Sources Used
            </Typography>
            <Stack sx={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {sources.map((source, idx) => (
                <Box key={idx} sx={{ py: 1.7, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Typography variant="body2" fontWeight={520} sx={{ color: '#e5e7eb' }}>
                    {source?.title || ''}
                  </Typography>
                  {source?.country && (
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                      {source.country}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default LifestyleTipsView;
