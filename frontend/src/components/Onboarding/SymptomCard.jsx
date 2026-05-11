import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Card, CardContent, Typography, CircularProgress, Alert, Collapse, Box, Button, Stack } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QuestionList from './QuestionList';
import { getCurrentUser } from '../../utils/auth';
import axiosInstance from '../../utils/axiosInstance';

const CARD_MIN_HEIGHT = 180;

const SymptomCard = ({ diseaseId }) => {
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [symptomCompletionStatus, setSymptomCompletionStatus] = useState({});

  useEffect(() => {
    const fetchSymptoms = async () => {
      if (!diseaseId) return;
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/symptoms/public/${diseaseId}`);
        const data = res.data?.data || [];
        setSymptoms(data);
        setError(null);
      } catch (err) {
        setError('Error fetching symptoms.');
      } finally {
        setLoading(false);
      }
    };
    fetchSymptoms();
  }, [diseaseId]);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setIsLoggedIn(false);
          return;
        }
        await getCurrentUser();
        setIsLoggedIn(true);
        // Fetch user's answered questions if logged in
        await fetchUserAnsweredQuestions();
      } catch (err) {
        console.error('Login check failed:', err);
        setIsLoggedIn(false);
      }
    };
    checkLogin();
  }, []);

  const fetchUserAnsweredQuestions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const response = await axiosInstance.get('/users/my-disease-data');
      const data = response.data;
      if (data.success && data.data && data.data.symptoms) {
        const answeredIds = new Set();
        const completionStatus = {};
        data.data.symptoms.forEach(symptom => {
          const symptomQuestions = symptom.questions || [];
          const answeredCount = symptomQuestions.length;
          const isCompleted = answeredCount > 0;
          const symptomKey = symptom.name?.toLowerCase().trim();
          completionStatus[symptomKey] = {
            answered: answeredCount,
            total: answeredCount,
            completed: isCompleted,
            symptomId: symptom._id
          };
          symptomQuestions.forEach(question => {
            answeredIds.add(question._id);
          });
        });
        setAnsweredQuestions(answeredIds);
        setSymptomCompletionStatus(completionStatus);
      }
    } catch (err) {
      console.error('Error fetching answered questions:', err);
    }
  };

  const handleExpand = (symptomId) => setExpanded(expanded === symptomId ? null : symptomId);

  const isSymptomCompleted = (symptomId) => {
    const symptom = symptoms.find(s => s._id === symptomId);
    if (!symptom) return false;
    const symptomName = symptom.name?.toLowerCase().trim();
    const completionInfo = symptomCompletionStatus[symptomName];
    return completionInfo?.completed || false;
  };

  if (loading) {
    return (
      <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ my: 4 }}>
        {[...Array(2)].map((_, i) => (
          <Card key={i} sx={{ width: 380, height: 180, borderRadius: 4, m: 1 }}>
            <Box sx={{ p: 2 }}>
              <CircularProgress />
            </Box>
          </Card>
        ))}
      </Stack>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!symptoms.length) return (
    <Box textAlign="center" mt={4}>
      <AssignmentIcon color="disabled" fontSize="large" />
      <Typography color="text.secondary" mt={1}>No symptoms found for this disease.</Typography>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto', my: 4 }}>
      <Swiper
        style={{ padding: 0 }}
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        spaceBetween={20}
        slidesPerView={2}
        className="symptom-swiper modern-swiper"
        noSwiping={true}
        noSwipingClass="no-swiping"
      >
        {symptoms.map((symptom) => {
          const isCompleted = isSymptomCompleted(symptom._id);
          return (
            <SwiperSlide key={symptom._id} style={{ display: 'flex', justifyContent: 'center' }}>
              <Card
                className="no-swiping"
                elevation={expanded === symptom._id ? 8 : 2}
                sx={{
                  borderRadius: 4,
                  minHeight: CARD_MIN_HEIGHT,
                  width: 380,
                  background: expanded === symptom._id
                    ? 'linear-gradient(135deg, #23272f 60%, #1e2a3a 100%)'
                    : isCompleted 
                      ? 'linear-gradient(135deg, #1b5e20 60%, #2e7d32 100%)'
                      : '#23272f',
                  color: '#fff',
                  boxShadow: expanded === symptom._id
                    ? '0 8px 32px 0 rgba(0,0,0,0.25)'
                    : '0 2px 8px 0 rgba(0,0,0,0.12)',
                  border: expanded === symptom._id
                    ? '1.5px solid #90caf9'
                    : isCompleted
                      ? '1.5px solid #4caf50'
                      : '1px solid #222',
                  transition: 'box-shadow 0.3s, background 0.3s, border 0.3s',
                  position: 'relative',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <AssignmentIcon sx={{ mr: 1, color: isCompleted ? '#4caf50' : '#90caf9' }} />
                    <Typography variant="h6" fontWeight={700} color={isCompleted ? '#4caf50' : '#90caf9'}>
                      {symptom.name}
                    </Typography>
                    {isCompleted && isLoggedIn && (
                      <Box display="flex" alignItems="center" ml={2}>
                        <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20, mr: 0.5 }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#4caf50', 
                            fontWeight: 600,
                            fontSize: '0.875rem'
                          }}
                        >
                          Data Already Filled
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography variant="body2" color="#b0bec5" mb={2}>
                    {symptom.description}
                  </Typography>
                  <Button
                    variant={expanded === symptom._id ? "contained" : "outlined"}
                    color={isCompleted ? "success" : "primary"}
                    size="small"
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                      minWidth: 120,
                      bgcolor: expanded === symptom._id 
                        ? (isCompleted ? '#4caf50' : '#1976d2') 
                        : 'transparent',
                      color: expanded === symptom._id ? '#fff' : (isCompleted ? '#4caf50' : '#90caf9'),
                      borderColor: isCompleted ? '#4caf50' : '#90caf9',
                      '&:hover': {
                        bgcolor: isCompleted ? '#388e3c' : '#1565c0',
                        color: '#fff',
                        borderColor: isCompleted ? '#4caf50' : '#90caf9',
                      },
                    }}
                    onClick={() => handleExpand(symptom._id)}
                    fullWidth
                  >
                    {expanded === symptom._id ? "Hide Questions" : (isCompleted ? "View Details" : "Start")}
                  </Button>
                  <Collapse in={expanded === symptom._id} timeout="auto" unmountOnExit>
                    <Box mt={2}>
                      <QuestionList 
                        symptomId={symptom._id} 
                        symptomName={symptom.name} 
                        isLoggedIn={isLoggedIn}
                        onDataUpdated={fetchUserAnsweredQuestions}
                      />
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </SwiperSlide>
          );
        })}
      </Swiper>
      <style>{`
        .modern-swiper .swiper-button-next, .modern-swiper .swiper-button-prev {
          color: #90caf9;
          background: rgba(25, 118, 210, 0.12);
          border-radius: 50%;
          width: 48px;
          height: 48px;
          top: 45%;
          box-shadow: 0 4px 16px 0 rgba(25, 118, 210, 0.15);
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modern-swiper .swiper-button-next { right: 24px; }
        .modern-swiper .swiper-button-prev { left: 24px; }
        .modern-swiper .swiper-button-next:hover, .modern-swiper .swiper-button-prev:hover {
          background: #1976d2;
          color: #fff;
          box-shadow: 0 8px 32px 0 rgba(25, 118, 210, 0.25);
        }
        .modern-swiper .swiper-button-next:after, .modern-swiper .swiper-button-prev:after {
          font-size: 2rem;
          font-weight: bold;
        }
        .modern-swiper .swiper-pagination {
          margin-top: 40px;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }
        .modern-swiper .swiper-pagination-bullet {
          background: #90caf9;
          opacity: 0.5;
          box-shadow: 0 0 8px #90caf9;
          transition: background 0.2s, opacity 0.2s, box-shadow 0.2s;
        }
        .modern-swiper .swiper-pagination-bullet-active {
          background: #1976d2;
          opacity: 1;
          box-shadow: 0 0 16px #1976d2, 0 0 4px #90caf9;
        }
      `}</style>
    </Box>
  );
};

export default SymptomCard; 
