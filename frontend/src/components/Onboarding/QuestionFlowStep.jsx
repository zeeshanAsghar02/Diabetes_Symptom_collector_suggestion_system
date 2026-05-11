import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  alpha,
  CircularProgress,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { motion as _motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { getCurrentUser } from '../../utils/auth';
import { differenceInYears, parseISO } from 'date-fns';

const QuestionFlowStep = ({ onBack, onAnswersSubmit, isLoggedIn, initialSymptomId = null }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [symptoms, setSymptoms] = useState([]);
  const [questions, setQuestions] = useState({});
  const [answers, setAnswers] = useState({});
  const [currentSymptomIndex, setCurrentSymptomIndex] = useState(0);
  const [error, setError] = useState(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Age and DOB are not stored separately anymore; age is stored in `answers` under the age question id
  const [answeredIds, setAnsweredIds] = useState(new Set());
  const [allAnswered, setAllAnswered] = useState(false);

  // Immediate guard: if this component mounts and user is not logged in, redirect to signin
  useEffect(() => {
    if (!isLoggedIn) {
      const symptomId = initialSymptomId || '';
      // Save the current state before redirecting
      localStorage.setItem('onboardingState', JSON.stringify({
        answers,
        currentSymptomIndex
      }));
      navigate(`/signin?returnTo=onboarding&returnToStep=1${symptomId ? `&symptomId=${symptomId}` : ''}`);
      return;
    }

    // Restore state if returning from login
    const savedState = localStorage.getItem('onboardingState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setAnswers(state.answers || {});
  // answers will include any previously calculated age under a question id or _age_temp
        // Only restore symptom index if there's no initialSymptomId
        if (!initialSymptomId && state.currentSymptomIndex) {
          setCurrentSymptomIndex(state.currentSymptomIndex);
        }
        // Clear ALL saved onboarding state after restoring
        localStorage.removeItem('onboardingState');
        localStorage.removeItem('redirectAfterLogin');
        console.log('🧹 Cleared onboarding state from localStorage after restore');
      } catch (err) {
        console.error('Error restoring onboarding state:', err);
      }
    }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, initialSymptomId, navigate]); // Only run when login status or initialSymptomId changes

  // Store the current path for redirect after login
  useEffect(() => {
    if (!isLoggedIn) {
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
    }
  }, [isLoggedIn]);

  // Fetch symptoms and questions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch diseases (assuming diabetes is the first/only disease)
        const diseasesResponse = await axiosInstance.get('/diseases/public');
        const diseases = diseasesResponse.data.data || diseasesResponse.data;
        
        if (!diseases || diseases.length === 0) {
          throw new Error('No diseases found');
        }
        
        const diabetesDisease = diseases[0];
        
        if (!diabetesDisease || !diabetesDisease._id) {
          console.error('Disease data structure:', diabetesDisease);
          throw new Error('Invalid disease data structure');
        }
        
        // Fetch symptoms for diabetes
        const symptomsResponse = await axiosInstance.get(`/symptoms/public/${diabetesDisease._id}`);
        const symptomsData = symptomsResponse.data.data || symptomsResponse.data;
        
        if (!symptomsData || !Array.isArray(symptomsData) || symptomsData.length === 0) {
          console.error('Symptoms data structure:', symptomsResponse.data);
          throw new Error('No symptoms found or invalid data structure');
        }
        
        setSymptoms(symptomsData);
        
        // Fetch questions for each symptom
        const questionsObj = {};
        for (const symptom of symptomsData) {
          if (!symptom || !symptom._id) {
            console.warn('Invalid symptom data:', symptom);
            continue;
          }
          const questionsResponse = await axiosInstance.get(`/questions/public/symptom/${symptom._id}`);
          const questionsData = questionsResponse.data.data || questionsResponse.data || [];
          questionsObj[symptom._id] = questionsData;
        }
        
        setQuestions(questionsObj);

        // If an initialSymptomId was provided (from login redirect), set the current index accordingly
        if (initialSymptomId) {
          const idx = symptomsData.findIndex(s => s._id === initialSymptomId);
          if (idx >= 0) setCurrentSymptomIndex(idx);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load questions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [initialSymptomId]);

  // Fetch user's answered questions before rendering
  useEffect(() => {
    const fetchAnswered = async () => {
      try {
        const diseaseDataRes = await axiosInstance.get('/users/my-disease-data');
        let answeredSet = new Set();
        let totalQuestions = 0;
        let answeredQuestions = 0;
        if (diseaseDataRes.data.success && diseaseDataRes.data.data) {
          const data = diseaseDataRes.data.data;
          totalQuestions = data.totalQuestions;
          answeredQuestions = data.answeredQuestions;
          if (data.symptoms) {
            data.symptoms.forEach(symptom => {
              (symptom.questions || []).forEach(q => {
                answeredSet.add(q._id);
              });
            });
          }
        }
        setAnsweredIds(answeredSet);
        if (answeredQuestions === totalQuestions && totalQuestions > 0) {
          setAllAnswered(true);
        }
      } catch {
        // ignore error, fallback to normal flow
      }
    };
    fetchAnswered();
  }, []);

  // Fetch user's date of birth and calculate age -> store temporarily in answers as _age_temp
  useEffect(() => {
    const fetchDOB = async () => {
      const user = await getCurrentUser();
      if (user && user.date_of_birth) {
        // Calculate age from DOB
        const dob = typeof user.date_of_birth === 'string' ? parseISO(user.date_of_birth) : user.date_of_birth;
        const now = new Date();
        const years = differenceInYears(now, dob);
        
        // Calculate months
        const dobMonth = dob.getMonth();
        const dobDay = dob.getDate();
        const nowMonth = now.getMonth();
        const nowDay = now.getDate();
        
        let months = nowMonth - dobMonth;
        if (nowDay < dobDay) {
          months--;
        }
        if (months < 0) {
          months += 12;
        }
        
        // Format as "X years and Y months"
        const ageStr = months > 0 ? `${years} years and ${months} months` : `${years} years`;
        // Store a temporary age value in answers; it will be migrated to the real question id when that question renders
        setAnswers(prev => ({ ...prev, _age_temp: ageStr }));
      }
    };
    fetchDOB();
  }, []);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = async () => {
    // Clear any previous errors when moving between symptoms
    setError(null);
    
    // If user is not logged in, show login dialog
    if (!isLoggedIn) {
      setLoginDialogOpen(true);
      return;
    }
    
    // If this is the last symptom, submit all answers
    if (currentSymptomIndex >= symptoms.length - 1) {
      try {
        setSubmitting(true);
        setError(null);
        
        // Format and submit answers one by one
        const answerPromises = Object.entries(answers)
          .filter(([questionId, answerText]) => {
            if (!questionId) return false;
            if (questionId.startsWith('_')) return false; // internal keys
            if (answerText === null || answerText === undefined) return false;
            const asString = typeof answerText === 'string' ? answerText : String(answerText);
            return asString.trim() !== '';
          })
          .map(async ([questionId, answerText]) => {
            try {
              return await axiosInstance.post('/questions/answer', {
                questionId,
                answerText: String(answerText)
              });
            } catch (error) {
              console.error(`Failed to submit answer for question ${questionId}:`, error);
              throw error;
            }
          });

        // Submit all answers
        if (answerPromises.length === 0) {
          console.log('No valid answers to submit');
          onAnswersSubmit({});
          return;
        }

        await Promise.all(answerPromises);
        
        console.log('✅ All answers submitted successfully to database');
        
        // Clear all temporary storage after successful database save
        sessionStorage.removeItem('pendingOnboardingAnswers');
        sessionStorage.removeItem('onboardingState');
        localStorage.removeItem('onboardingState');
        localStorage.removeItem('redirectAfterLogin');
        console.log('🧹 Cleared all temporary onboarding storage after database save');
        
  // Call parent's onAnswersSubmit with collected answers
  onAnswersSubmit({...answers});
      } catch (err) {
        console.error('Error submitting answers:', err);
        setError(`Failed to submit answers: ${err.response?.data?.message || err.message}`);
      } finally {
        setSubmitting(false);
      }
    } else {
      // Move to next symptom
      setCurrentSymptomIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentSymptomIndex > 0) {
      setCurrentSymptomIndex(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const handleLoginRedirect = () => {
    // Close dialog and navigate to login page
    setLoginDialogOpen(false);
    navigate('/signin');
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ p: 6, textAlign: 'center', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (allAnswered) {
    return (
      <Box sx={{ p: 6, textAlign: 'center', minHeight: 400 }}>
        <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h4" fontWeight={700} color="success.main" gutterBottom>
          All questions completed!
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          You have answered all assessment questions. Your progress is 100%.
        </Typography>
        <Button variant="contained" color="primary" onClick={onAnswersSubmit} sx={{ borderRadius: 2, fontWeight: 700 }}>
          View Summary
        </Button>
      </Box>
    );
  }

  const currentSymptom = symptoms[currentSymptomIndex];
  let currentQuestions = questions[currentSymptom?._id] || [];
  currentQuestions = currentQuestions.filter(q => !answeredIds.has(q._id));
  // Always define progress
  const progress = symptoms.length > 0 ? ((currentSymptomIndex + 1) / symptoms.length) * 100 : 0;

  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 6, textAlign: 'center', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Error sx={{ fontSize: 60, color: theme.palette.error.main, mb: 2 }} />
        <Typography variant="h5" color="error" gutterBottom>
          Something went wrong
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Box>
    );
  }

  // If no symptoms or questions, show empty state
  if (symptoms.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: 'center', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5" color="text.primary" gutterBottom>
          No questions available
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          There are no questions available for assessment at this time.
        </Typography>
        <Button variant="contained" onClick={onBack}>
          Go Back
        </Button>
      </Box>
    );
  }

  // Remove the age field at the top, only show it as the answer to the question
  // Only show current symptom and its questions
  currentQuestions = currentQuestions.filter(q => !answeredIds.has(q._id));
  // Render only current symptom and its questions
  return (
    <Box sx={{ p: { xs: 3, md: 6 } }}>
      {/* Progress indicator */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          Symptom {currentSymptomIndex + 1} of {symptoms.length}
        </Typography>
        <Box sx={{ 
          width: '70%', 
          height: 8, 
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progress}%`,
            bgcolor: theme.palette.primary.main,
            borderRadius: 4,
            transition: 'width 0.5s ease'
          }} />
        </Box>
      </Box>
      {/* Only current symptom and its questions */}
      <_motion.div
        key={currentSymptom?._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Typography 
          variant="h4" 
          fontWeight={700} 
          color="primary" 
          gutterBottom
          sx={{ mb: 3 }}
        >
          {currentSymptom?.name}
        </Typography>
        {currentSymptom?.description && (
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ mb: 4 }}
          >
            {currentSymptom.description}
          </Typography>
        )}
        {/* Questions for current symptom only */}
        <Box sx={{ mb: 6 }}>
          {currentQuestions.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              No questions available for this symptom.
            </Alert>
          ) : (
            currentQuestions.map((question, index) => (
              <Box 
                key={question._id} 
                sx={{ 
                  mb: 4, 
                  p: 3, 
                  borderRadius: 2, 
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  color="text.primary" 
                  gutterBottom
                >
                  {index + 1}. {question.question_text}
                </Typography>
                {/* Render different input types based on question_type */}
                {question.question_type === 'text' && question.question_text.toLowerCase().includes('age') ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                      Your age (calculated from date of birth)
                    </Typography>
                    {/* Bind the displayed value to answers[question._id] so it will be submitted under the real question id */}
                    <TextField
                      fullWidth
                      variant="outlined"
                      value={answers[question._id] ?? answers._age_temp ?? ''}
                      disabled
                      InputProps={{
                        readOnly: true,
                      }}
                      helperText="This value is automatically calculated from your date of birth"
                    />
                    {/* When this question is mounted, ensure the age value is stored under the question's real id */}
                    {/* We use an effect-like approach by setting it imperatively if not already set. */}
                    {(!answers[question._id] && answers._age_temp) && (
                      (() => {
                        // migrate temporary age into the real question id
                        setAnswers(prev => {
                          const copy = { ...prev };
                          copy[question._id] = prev._age_temp;
                          delete copy._age_temp;
                          return copy;
                        });
                        return null;
                      })()
                    )}
                  </Box>
                ) : null}
                {question.question_type === 'text' && !question.question_text.toLowerCase().includes('age') && (
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Your answer"
                    value={answers[question._id] || ''}
                    onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                    sx={{ mt: 2 }}
                  />
                )}
                {question.question_type === 'radio' && (
                  <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
                    <RadioGroup
                      value={answers[question._id] || ''}
                      onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                    >
                      {question.options.map((option, i) => (
                        <FormControlLabel 
                          key={i} 
                          value={option} 
                          control={<Radio />} 
                          label={option} 
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}
                {question.question_type === 'dropdown' && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <Select
                      value={answers[question._id] || ''}
                      onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>
                        <em>Select an option</em>
                      </MenuItem>
                      {question.options.map((option, i) => (
                        <MenuItem key={i} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            ))
          )}
        </Box>
      </_motion.div>
      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          onClick={handleNext}
          disabled={submitting}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            background: currentSymptomIndex >= symptoms.length - 1 
              ? `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
              : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            '&:hover': {
              background: currentSymptomIndex >= symptoms.length - 1 
                ? `linear-gradient(135deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`
                : `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
            },
          }}
        >
          {submitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : currentSymptomIndex >= symptoms.length - 1 ? (
            'Submit'
          ) : (
            'Next'
          )}
        </Button>
      </Box>
      {/* Login Dialog */}
      <Dialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
      >
        <DialogTitle>Login Required</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You need to be logged in to submit your answers. Would you like to log in now?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLoginRedirect} variant="contained" autoFocus>
            Log In
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionFlowStep;
