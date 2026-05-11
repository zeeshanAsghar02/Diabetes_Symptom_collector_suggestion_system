import React, { useState, useEffect } from 'react';
import { Box, Container, Card, CardContent, CardActions, Button, LinearProgress, Chip, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Person as PersonIcon, Restaurant as RestaurantIcon, FitnessCenter as FitnessCenterIcon, Lightbulb as LightbulbIcon, EmojiEvents as EmojiEventsIcon, Chat as ChatIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance.js';

const PersonalizedSuggestionDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const isMd = useMediaQuery(theme.breakpoints.down('md'));
  const [personalInfoCompletion, setPersonalInfoCompletion] = useState(0);

  useEffect(() => { fetchCompletion(); }, []);

  const fetchCompletion = async () => {
    try {
      const [personalRes, medicalRes] = await Promise.all([
        axiosInstance.get('/personalized-system/personal-info'),
        axiosInstance.get('/personalized-system/medical-info'),
      ]);
      const personalFields = ['fullName', 'date_of_birth', 'gender', 'phone_number'];
      const medicalFields = ['diabetes_type', 'diagnosis_date'];
      const personalData = personalRes.data?.data || {};
      const medicalData = medicalRes.data?.data || {};
      
      // Helper to check if a value is actually filled and not encrypted
      const isValidValue = (value) => {
        if (!value) return false;
        if (value === null || value === undefined || value === '') return false;
        // Check if the value looks like an encrypted string (contains ':' and looks like hex)
        if (typeof value === 'string' && value.includes(':') && value.length > 50) {
          return false;
        }
        return true;
      };
      
      const total = personalFields.length + medicalFields.length;
      const completed = [...personalFields, ...medicalFields].reduce((count, field) => {
        const source = personalFields.includes(field) ? personalData : medicalData;
        return isValidValue(source[field]) ? count + 1 : count;
      }, 0);
      setPersonalInfoCompletion(total ? Math.round((completed / total) * 100) : 0);
    } catch (e) {
      setPersonalInfoCompletion(0);
    }
  };

  const sections = [
    { id: 'personal-medical', title: 'Personal & Medical Information', description: 'Manage your personal details and medical history', icon: <PersonIcon sx={{ fontSize: 40 }} />, color: '#2563eb', route: '/personalized-suggestions/personal-medical', completion: personalInfoCompletion, isActive: true },
    { id: 'diet-plan', title: 'Nutrition & Diet Plan', description: 'Daily and monthly meal plans with AI', icon: <RestaurantIcon sx={{ fontSize: 40 }} />, color: '#10b981', route: '/personalized-suggestions/diet-plan', completion: 0, isActive: true },
    { id: 'exercise-plan', title: 'Exercise Plan', description: 'Customized fitness routines and workouts', icon: <FitnessCenterIcon sx={{ fontSize: 40 }} />, color: '#f59e0b', route: '/personalized-suggestions/exercise-plan', completion: 0, isActive: true },
    { id: 'lifestyle-tips', title: 'Lifestyle Tips', description: 'Daily habits and wellness recommendations', icon: <LightbulbIcon sx={{ fontSize: 40 }} />, color: '#8b5cf6', route: '/personalized-suggestions/lifestyle-tips', completion: 0, isActive: true },
    { id: 'pro-tips', title: 'Pro Tips', description: 'Expert advice and best practices', icon: <EmojiEventsIcon sx={{ fontSize: 40 }} />, color: '#ec4899', route: '/personalized-suggestions/pro-tips', completion: 0, isActive: false },
    { id: 'chat-assistant', title: 'Chat Assistant', description: 'Get instant answers from AI assistant', icon: <ChatIcon sx={{ fontSize: 40 }} />, color: '#06b6d4', route: '/personalized-suggestions/chat-assistant', completion: 0, isActive: true },
  ];

  const handleClick = (section) => navigate(section.route, { state: { from: 'dashboard' } });
  const columns = isSm ? '1fr' : (isMd ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)');

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 40%, #e0f2fe 100%)',
      py: 5,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '400px',
        background: 'radial-gradient(circle at 20% 10%, rgba(99,102,241,0.08), transparent 40%), radial-gradient(circle at 80% 20%, rgba(14,165,233,0.08), transparent 40%)',
        zIndex: 0
      }
    }}>
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ mb: 6, textAlign: 'center', position: 'relative' }}>
          {/* Floating decorative icons */}
          <Box sx={{ position: 'absolute', top: -20, left: '10%', fontSize: '3rem', opacity: 0.15, animation: 'float 3s ease-in-out infinite' }}>💊</Box>
          <Box sx={{ position: 'absolute', top: -10, right: '15%', fontSize: '2.5rem', opacity: 0.15, animation: 'float 4s ease-in-out infinite', animationDelay: '1s' }}>🏥</Box>
          <Box sx={{ position: 'absolute', bottom: -30, left: '20%', fontSize: '2rem', opacity: 0.15, animation: 'float 3.5s ease-in-out infinite', animationDelay: '0.5s' }}>🩺</Box>
          <Box sx={{ position: 'absolute', bottom: -20, right: '10%', fontSize: '2.5rem', opacity: 0.15, animation: 'float 4.5s ease-in-out infinite', animationDelay: '1.5s' }}>❤️</Box>
          
          <Box sx={{ display: 'inline-block', mb: 2 }}>
            <Box component="span" sx={{ fontSize: '4rem', animation: 'pulse 2s ease-in-out infinite' }}>✨</Box>
          </Box>
          <Typography variant="h3" fontWeight="800" gutterBottom sx={{ 
            background: 'linear-gradient(135deg, #2563eb 0%, #6366f1 50%, #0ea5e9 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            mb: 2,
            letterSpacing: '-0.5px',
            fontSize: { xs: '2rem', md: '3rem' },
            animation: 'slideInDown 0.8s ease-out'
          }}>
            🌟 Personalized Wellness Hub 🌟
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.15rem', maxWidth: 700, mx: 'auto', animation: 'fadeIn 1s ease-out' }}>
            💡 Your complete health companion with AI-powered recommendations across diet, exercise, and lifestyle management
          </Typography>
          
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-20px); }
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.2); opacity: 0.8; }
            }
            @keyframes slideInDown {
              from { opacity: 0; transform: translateY(-30px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: columns, gap: 3, alignItems: 'stretch' }}>
          {sections.map((section) => (
            <Box key={section.id} sx={{ minWidth: 0 }}>
              <Card
                elevation={0}
                sx={{
                  width: '100%',
                  minWidth: 0,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 4,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: `2px solid ${section.isActive ? '#e2e8f0' : '#f1f5f9'}`,
                  background: section.isActive ? '#fff' : '#f8fafc',
                  cursor: section.isActive ? 'pointer' : 'default',
                  '&:hover': { 
                    boxShadow: section.isActive ? `0 20px 60px ${section.color}30` : 'none', 
                    transform: section.isActive ? 'translateY(-8px) scale(1.02)' : 'none',
                    borderColor: section.isActive ? section.color : '#f1f5f9'
                  },
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                  <Chip 
                    label={section.isActive ? '✓ Active' : '🔒 Coming Soon'} 
                    size="small" 
                    sx={{ 
                      bgcolor: section.isActive ? '#10b981' : '#d1d5db', 
                      color: section.isActive ? '#fff' : '#6b7280', 
                      fontWeight: 'bold',
                      boxShadow: section.isActive ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
                      animation: section.isActive ? 'bounce 2s ease-in-out infinite' : 'none'
                    }} 
                  />
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '120px', 
                  bgcolor: `${section.color}10`, 
                  color: section.color, 
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%',
                    right: '-50%',
                    width: '200%',
                    height: '200%',
                    background: `radial-gradient(circle, ${section.color}20, transparent)`,
                    animation: section.isActive ? 'rotate 20s linear infinite' : 'none'
                  },
                  '&:hover .icon': {
                    transform: 'scale(1.2) rotate(10deg)',
                  }
                }}>
                  <Box className="icon" sx={{ transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', zIndex: 1 }}>
                    {section.icon}
                  </Box>
                </Box>
                <style>{`
                  @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                  }
                  @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>
                <CardContent sx={{ flexGrow: 1, pt: 3, pb: 2, px: 2 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', minHeight: '64px', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }}>
                    {section.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }}>
                    {section.description}
                  </Typography>
                  {section.isActive && section.completion > 0 ? (
                    <Box sx={{ mt: 'auto', pt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">Completion</Typography>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: section.color }}>{section.completion}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={section.completion} sx={{ height: 6, borderRadius: 3, bgcolor: '#e5e7eb', '& .MuiLinearProgress-bar': { bgcolor: section.color, borderRadius: 3 } }} />
                    </Box>
                  ) : null}
                </CardContent>
                <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
                  <Button
                    fullWidth
                    variant={section.isActive ? 'contained' : 'outlined'}
                    sx={{
                      bgcolor: section.isActive ? section.color : 'transparent',
                      color: section.isActive ? '#fff' : section.color,
                      borderColor: section.color,
                      textTransform: 'none',
                      fontWeight: 'bold',
                      '&:hover': { bgcolor: section.isActive ? section.color : `${section.color}10` },
                    }}
                    onClick={(e) => { try { e.stopPropagation?.(); } catch(_) {} handleClick(section); }}
                  >
                    {section.isActive ? 'Continue' : 'View'}
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 5, p: 3, bgcolor: '#f0f9ff', borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">💡 Start by completing your Personal & Medical Information to unlock personalized recommendations</Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default PersonalizedSuggestionDashboard;
 
