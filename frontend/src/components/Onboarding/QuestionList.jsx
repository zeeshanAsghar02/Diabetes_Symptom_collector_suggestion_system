import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  TextField,
  Select,
  MenuItem,
  Slider,
  Stack,
  Paper,
  Button,
  Chip,
  alpha,
} from '@mui/material';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { useTheme } from '../../contexts/useThemeContext';

const QuestionList = forwardRef(({ symptomId, symptomName, isLoggedIn, onDataUpdated, onAnswersChange, userAge, userGender }, ref) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState({});
  const [success, setSuccess] = useState({});
  const [saveError, setSaveError] = useState({});
  const [globalSaving, setGlobalSaving] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState(false);
  const [answeredIds, setAnsweredIds] = useState([]);
  const [heightValues, setHeightValues] = useState({}); // Store feet/inches for each height question
  const questionCacheRef = useRef({});
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Expose saveAll function to parent
  useImperativeHandle(ref, () => ({
    saveAll: handleSaveAll,
    hasUnansweredQuestions: () => {
      const unanswered = questions.filter((q) => !answeredIds.includes(q._id) && !answers[q._id]);
      return unanswered.length > 0;
    }
  }));

  useEffect(() => {
    let isMounted = true;

    const syncQuestionState = (questionList, loadedAnswers, answeredList) => {
      if (!isMounted) return;

      setQuestions(questionList);
      setAnsweredIds(answeredList);
      setLoading(false);
      setError(null);

      if (Object.keys(loadedAnswers).length > 0) {
        setAnswers((prev) => {
          const nextAnswers = { ...prev, ...loadedAnswers };
          if (onAnswersChange) {
            setTimeout(() => onAnswersChange(nextAnswers, questionList), 0);
          }
          return nextAnswers;
        });
      } else if (onAnswersChange) {
        setTimeout(() => onAnswersChange(answers, questionList), 0);
      }
    };

    const fetchQuestions = async () => {
      if (!symptomId) return;

      const cached = questionCacheRef.current[symptomId];
      if (cached) {
        syncQuestionState(cached.questions, cached.answers, cached.answeredIds);
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.get(`/questions/public/symptom/${symptomId}`);
        const data = response.data;
        const questionsList = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
        setQuestions(questionsList);
        setError(null);
        
        console.log('QuestionList - userAge:', userAge);
        console.log('QuestionList - userGender:', userGender);
        console.log('QuestionList - questions loaded:', questionsList.length);
        
        // Auto-fill age and gender if questions ask for them and user data is available
        const updatedAnswers = {};
        const preFilledQuestionIds = [];
        
        if (userAge && questionsList.length > 0) {
          const ageQuestion = questionsList.find((q) => 
            q.question_text.toLowerCase().includes('age') && 
            (q.question_type === 'text' || q.question_type === 'number')
          );
          if (ageQuestion) {
            // Use the formatted age string directly (e.g., "23 years and 4 months")
            updatedAnswers[ageQuestion._id] = typeof userAge === 'string' ? userAge : userAge.toString();
            preFilledQuestionIds.push(ageQuestion._id);
          }
        }
        
        if (userGender && questionsList.length > 0) {
          const genderQuestion = questionsList.find((q) => 
            q.question_text.toLowerCase().includes('gender') && 
            q.question_type === 'radio'
          );
          if (genderQuestion) {
            // Normalize gender value to match question options (Male/Female)
            const normalizedGender = userGender.charAt(0).toUpperCase() + userGender.slice(1).toLowerCase();
            updatedAnswers[genderQuestion._id] = normalizedGender;
            preFilledQuestionIds.push(genderQuestion._id);
          }
        }
        
        // Only log if we actually have pre-filled answers
        if (Object.keys(updatedAnswers).length > 0) {
          console.log('Pre-filled answers:', updatedAnswers);
        }
        
        if (Object.keys(updatedAnswers).length > 0) {
          setAnswers((prev) => {
            const newAnswers = { ...prev, ...updatedAnswers };
            // Notify parent after state update
            setTimeout(() => {
              if (onAnswersChange) {
                onAnswersChange(newAnswers, questionsList);
              }
            }, 0);
            return newAnswers;
          });
        }

        const cachedAnswers = { ...updatedAnswers };
        
        // Only fetch user's answered questions if logged in
        if (isLoggedIn && questionsList.length > 0) {
          try {
            const ansRes = await axiosInstance.get('/users/my-disease-data');
            const ansData = ansRes.data;
            const answered = [...preFilledQuestionIds]; // Include pre-filled questions
            const loadedAnswers = {}; // Store the actual answer values
            
            if (ansData.data && ansData.data.symptoms && symptomName) {
              // Case-insensitive, trimmed match for symptom name
              const symptomBlock = ansData.data.symptoms.find((s) => s.name.trim().toLowerCase() === symptomName.trim().toLowerCase());
              if (symptomBlock && Array.isArray(symptomBlock.questions)) {
                for (const q of symptomBlock.questions) {
                  // Try to match by question text (case-insensitive, trimmed)
                  const match = questionsList.find((qq) => qq.question_text.trim().toLowerCase() === q.question.trim().toLowerCase());
                  if (match) {
                    answered.push(match._id);
                    // Store the actual answer value
                    loadedAnswers[match._id] = q.answer || 'answered';
                  }
                }
              }
            }
            setAnsweredIds(answered);

            answered.forEach((questionId) => {
              if (loadedAnswers[questionId] === undefined && cachedAnswers[questionId] === undefined) {
                const matchedQuestion = questionsList.find((question) => question._id === questionId);
                if (matchedQuestion) {
                  cachedAnswers[questionId] = 'answered';
                }
              }
            });
            
            // Set the loaded answers in state
            if (Object.keys(loadedAnswers).length > 0) {
              setAnswers(prev => {
                const newAnswers = { ...prev, ...loadedAnswers };
                // Notify parent with actual answer values
                setTimeout(() => {
                  if (onAnswersChange) {
                    onAnswersChange(newAnswers, questionsList);
                  }
                }, 100);
                return newAnswers;
              });
            } else if (answered.length === questionsList.length && onAnswersChange) {
              // Fallback: If no answer values but all questions marked as answered
              const mockAnswers = {};
              questionsList.forEach(q => {
                if (answered.includes(q._id)) {
                  mockAnswers[q._id] = 'answered';
                }
              });
              setTimeout(() => {
                onAnswersChange(mockAnswers, questionsList);
              }, 100);
            }

            questionCacheRef.current[symptomId] = {
              questions: questionsList,
              answers: { ...cachedAnswers, ...loadedAnswers },
              answeredIds: answered,
            };
          } catch (err) {
            // If user data fetch fails, just continue without answered questions
            setAnsweredIds([]);
            questionCacheRef.current[symptomId] = {
              questions: questionsList,
              answers: cachedAnswers,
              answeredIds: preFilledQuestionIds,
            };
          }
        } else {
          setAnsweredIds(preFilledQuestionIds);
          questionCacheRef.current[symptomId] = {
            questions: questionsList,
            answers: cachedAnswers,
            answeredIds: preFilledQuestionIds,
          };
        }
      } catch (err) {
        setError('Error fetching questions.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchQuestions();

    return () => {
      isMounted = false;
    };
  }, [symptomId, symptomName, isLoggedIn, userAge, userGender, onAnswersChange]);

  const handleInputChange = useCallback((questionId, value) => {
    // Update state immediately
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: value };
      // Notify parent immediately - React 18 will batch automatically
      if (onAnswersChange) {
        onAnswersChange(newAnswers, questions);
      }
      return newAnswers;
    });
    setSuccess((prev) => ({ ...prev, [questionId]: false }));
    setSaveError((prev) => ({ ...prev, [questionId]: '' }));
  }, [onAnswersChange, questions]);

  const handleSave = async (questionId) => {
    // For unauthenticated users, just mark as saved locally
    if (!isLoggedIn) {
      setSuccess((prev) => ({ ...prev, [questionId]: true }));
      return;
    }
    
    setSaving((prev) => ({ ...prev, [questionId]: true }));
    setSuccess((prev) => ({ ...prev, [questionId]: false }));
    setSaveError((prev) => ({ ...prev, [questionId]: '' }));
    try {
      const answerText = answers[questionId];
      if (!answerText || answerText.trim() === '') {
        setSaveError((prev) => ({ ...prev, [questionId]: 'Please provide an answer.' }));
        setSaving((prev) => ({ ...prev, [questionId]: false }));
        return;
      }
      await axiosInstance.post('/questions/answer', { questionId, answerText });
      setSuccess((prev) => ({ ...prev, [questionId]: true }));
      
      // Call the callback to refresh completion status
      if (onDataUpdated) {
        onDataUpdated();
      }
    } catch (err) {
      setSaveError((prev) => ({ ...prev, [questionId]: err.response?.data?.message || 'Failed to save answer.' }));
    } finally {
      setSaving((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleSaveAll = async () => {
    // For unauthenticated users, just mark as saved locally
    if (!isLoggedIn) {
      setGlobalSuccess(true);
      // Store answers in sessionStorage for later use
      // Get existing pending answers if any
      const existingData = sessionStorage.getItem('pendingOnboardingAnswers');
      let existingAnswers = {};
      
      if (existingData) {
        try {
          const parsed = JSON.parse(existingData);
          existingAnswers = parsed.answers || {};
        } catch (e) {
          console.error('Failed to parse existing answers:', e);
        }
      }
      
      // Merge new answers with existing ones
      const mergedAnswers = { ...existingAnswers, ...answers };
      
      sessionStorage.setItem('pendingOnboardingAnswers', JSON.stringify({
        answers: mergedAnswers,
        symptomId,
        symptomName,
        lastUpdated: new Date().toISOString(),
      }));
      
      console.log('💾 Saved to sessionStorage:');
      console.log('  - Symptom:', symptomName);
      console.log('  - New answers:', Object.keys(answers).length);
      console.log('  - Total answers:', Object.keys(mergedAnswers).length);
      console.log('  - Answer details:', mergedAnswers);
      return;
    }
    
    setGlobalSaving(true);
    setGlobalError('');
    setGlobalSuccess(false);
    
    // Clear any pending answers from sessionStorage before saving to database
    const hadPendingAnswers = sessionStorage.getItem('pendingOnboardingAnswers');
    
    try {
      const promises = Object.keys(answers).map(async (questionId) => {
        const answerText = answers[questionId];
        if (!answerText || answerText.trim() === '') {
          throw new Error(`Please provide an answer for all questions.`);
        }
        return axiosInstance.post('/questions/answer', { questionId, answerText });
      });
      await Promise.all(promises);
      setGlobalSuccess(true);
      setAnswers({});
      
      // Clear all temporary storage after successful database save
      if (hadPendingAnswers) {
        sessionStorage.removeItem('pendingOnboardingAnswers');
        sessionStorage.removeItem('onboardingState');
        localStorage.removeItem('onboardingState');
        localStorage.removeItem('redirectAfterLogin');
        console.log('🧹 Cleared all temporary storage after saving to database');
      }
      
      // Call the callback to refresh completion status
      if (onDataUpdated) {
        onDataUpdated();
      }
    } catch (err) {
      setGlobalError(err.message || 'Failed to save answers.');
    } finally {
      setGlobalSaving(false);
    }
  };

  const renderQuestion = (question) => {
    const value = answers[question._id] || '';
    const isAnswered = answeredIds.includes(question._id);
    
    // ✅ USE DATABASE RENDER_CONFIG for special rendering
    if (question.render_config && question.render_config.type === 'unit_conversion') {
      const config = question.render_config.config;
      
      // Height unit conversion (feet/inches → cm)
      if (!heightValues[question._id] && value) {
        const cmValue = parseFloat(value);
        if (!isNaN(cmValue)) {
          const totalInches = cmValue / 2.54;
          const feet = Math.floor(totalInches / 12);
          const inches = Math.round(totalInches % 12);
          setHeightValues(prev => ({
            ...prev,
            [question._id]: { feet, inches }
          }));
        }
      }
      
      const currentHeight = heightValues[question._id] || { feet: '', inches: '' };
      
      // Dynamically get units from config
      const feetUnit = config.from_units.find(u => u.name === 'feet');
      const inchesUnit = config.from_units.find(u => u.name === 'inches');
      
      return (
        <Box display="flex" gap={2} alignItems="center">
          <Select
            value={currentHeight.feet}
            onChange={(e) => {
              const feet = parseFloat(e.target.value) || 0;
              const inches = parseFloat(currentHeight.inches) || 0;
              // Use formula from database
              const totalCm = Math.round((feet * 30.48) + (inches * 2.54));
              setHeightValues(prev => ({
                ...prev,
                [question._id]: { feet: e.target.value, inches: currentHeight.inches }
              }));
              handleInputChange(question._id, totalCm.toString());
            }}
            disabled={isAnswered}
            displayEmpty
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="" disabled>{feetUnit?.label || 'Feet'}</MenuItem>
            {(feetUnit?.options || [3, 4, 5, 6, 7, 8]).map(ft => (
              <MenuItem key={ft} value={ft}>{ft} ft</MenuItem>
            ))}
          </Select>
          <Select
            value={currentHeight.inches}
            onChange={(e) => {
              const feet = parseFloat(currentHeight.feet) || 0;
              const inches = parseFloat(e.target.value) || 0;
              const totalCm = Math.round((feet * 30.48) + (inches * 2.54));
              setHeightValues(prev => ({
                ...prev,
                [question._id]: { feet: currentHeight.feet, inches: e.target.value }
              }));
              handleInputChange(question._id, totalCm.toString());
            }}
            disabled={isAnswered}
            displayEmpty
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="" disabled>{inchesUnit?.label || 'Inches'}</MenuItem>
            {(inchesUnit?.options || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).map(inch => (
              <MenuItem key={inch} value={inch}>{inch} in</MenuItem>
            ))}
          </Select>
          {currentHeight.feet && currentHeight.inches !== '' && (
            <Typography variant="body2" color="text.secondary">
              ({Math.round((parseFloat(currentHeight.feet) * 30.48) + (parseFloat(currentHeight.inches) * 2.54))} cm)
            </Typography>
          )}
        </Box>
      );
    }
    
    // ✅ RESPECT DATABASE QUESTION_TYPE (no hardcoded overrides)
    switch (question.question_type) {
      case 'radio':
        return (
          <RadioGroup
            value={value}
            onChange={(e) => handleInputChange(question._id, e.target.value)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: 1,
              mt: 1,
            }}
          >
            {(question.options || []).map((option) => {
              const selected = value === option;
              return (
              <Paper
                key={option}
                component="button"
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={isAnswered}
                onClick={() => !isAnswered && handleInputChange(question._id, option)}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  py: 1.35,
                  px: 1.6,
                  borderRadius: 2.5,
                  cursor: isAnswered ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  color: 'text.primary',
                  border: (theme) => `1px solid ${selected ? alpha('#0EA5E9', 0.55) : alpha(theme.palette.divider, isDarkMode ? 0.35 : 0.55)}`,
                  bgcolor: selected ? alpha('#22D3EE', isDarkMode ? 0.16 : 0.08) : alpha('#fff', isDarkMode ? 0.02 : 0.78),
                  boxShadow: selected ? `0 10px 26px ${alpha('#0EA5E9', 0.12)}` : 'none',
                  opacity: isAnswered && !selected ? 0.62 : 1,
                  transition: 'transform 0.18s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: isAnswered ? 'none' : 'translateY(-1px)',
                    borderColor: alpha('#0EA5E9', 0.45),
                    bgcolor: alpha('#22D3EE', isDarkMode ? 0.12 : 0.06),
                    boxShadow: isAnswered ? 'none' : `0 10px 24px ${alpha('#0f172a', isDarkMode ? 0.24 : 0.07)}`,
                  },
                  '&:focus-visible': {
                    outline: `3px solid ${alpha('#22D3EE', 0.28)}`,
                    outlineOffset: 2,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.15, minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      color: selected ? '#0EA5E9' : 'text.disabled',
                      bgcolor: selected ? alpha('#0EA5E9', 0.12) : alpha('#94a3b8', 0.08),
                    }}
                  >
                    {selected ? <CheckCircle sx={{ fontSize: 18 }} /> : <RadioButtonUnchecked sx={{ fontSize: 18 }} />}
                  </Box>
                  <Typography sx={{ fontWeight: selected ? 750 : 600, fontSize: '0.94rem', lineHeight: 1.35 }}>
                    {option}
                  </Typography>
                </Box>
                {selected && (
                  <Chip
                    label="Selected"
                    size="small"
                    sx={{ height: 22, fontSize: '0.68rem', fontWeight: 800, color: '#0e7490', bgcolor: alpha('#22D3EE', 0.14) }}
                  />
                )}
              </Paper>
              );
            })}
          </RadioGroup>
        );
        
      case 'checkbox':
        return (
          <Stack spacing={1} sx={{ mt: 1 }}>
              {(question.options || []).map((option) => {
                const checked = Array.isArray(value) ? value.includes(option) : false;
                return (
                <Paper
                  key={option}
                  component="button"
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  disabled={isAnswered}
                  onClick={() => {
                      if (isAnswered) return;
                      let newValue = Array.isArray(value) ? [...value] : [];
                      if (!checked) newValue.push(option);
                      else newValue = newValue.filter((v) => v !== option);
                      handleInputChange(question._id, newValue);
                    }}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.15,
                    py: 1.35,
                    px: 1.6,
                    borderRadius: 2.5,
                    cursor: isAnswered ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    color: 'text.primary',
                    border: (theme) => `1px solid ${checked ? alpha('#0EA5E9', 0.55) : alpha(theme.palette.divider, isDarkMode ? 0.35 : 0.55)}`,
                    bgcolor: checked ? alpha('#22D3EE', isDarkMode ? 0.16 : 0.08) : alpha('#fff', isDarkMode ? 0.02 : 0.78),
                    opacity: isAnswered && !checked ? 0.62 : 1,
                    transition: 'transform 0.18s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: isAnswered ? 'none' : 'translateY(-1px)',
                      borderColor: alpha('#0EA5E9', 0.45),
                      bgcolor: alpha('#22D3EE', isDarkMode ? 0.12 : 0.06),
                    },
                    '&:focus-visible': {
                      outline: `3px solid ${alpha('#22D3EE', 0.28)}`,
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1.2,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      color: checked ? '#0EA5E9' : 'text.disabled',
                      bgcolor: checked ? alpha('#0EA5E9', 0.12) : alpha('#94a3b8', 0.08),
                    }}
                  >
                    {checked ? <CheckCircle sx={{ fontSize: 18 }} /> : <RadioButtonUnchecked sx={{ fontSize: 18 }} />}
                  </Box>
                  <Typography sx={{ fontWeight: checked ? 750 : 600, fontSize: '0.94rem', lineHeight: 1.35 }}>
                    {option}
                  </Typography>
                </Paper>
                );
              })}
          </Stack>
        );
        
      case 'dropdown':
        const dropdownOptions = question.options || [];
        const hasValue = dropdownOptions.includes(value);
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Select
              fullWidth
              value={hasValue ? value : ''}
              onChange={(e) => handleInputChange(question._id, e.target.value)}
              disabled={dropdownOptions.length === 0 || isAnswered}
              displayEmpty
              renderValue={(selected) => selected || 'Select...'}
              MenuProps={{
                PaperProps: {
                  sx: { zIndex: 20000, pointerEvents: 'auto' }
                },
                disablePortal: false,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <MenuItem value="" disabled>Select...</MenuItem>
              {dropdownOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </Box>
        );
        
      case 'range':
        return <Slider value={typeof value === 'number' ? value : 50} onChange={(_, v) => handleInputChange(question._id, v)} aria-label="Default" valueLabelDisplay="auto" disabled={isAnswered} />;
        
      case 'number':
        return (
          <TextField 
            fullWidth 
            type="number" 
            variant="outlined" 
            size="small" 
            value={value} 
            onChange={(e) => handleInputChange(question._id, e.target.value)} 
            disabled={isAnswered}
            autoComplete="off"
            inputProps={{
              min: 0,
              step: 1
            }}
          />
        );
        
      case 'text':
      case 'textarea':
      case 'date':
      case 'time':
      case 'datetime-local':
      case 'email':
      case 'password':
      case 'tel':
      case 'url':
      case 'color':
        return (
          <TextField 
            fullWidth 
            type={question.question_type} 
            variant="outlined" 
            size="small" 
            value={value} 
            onChange={(e) => handleInputChange(question._id, e.target.value)} 
            disabled={isAnswered}
            autoComplete="off"
            multiline={question.question_type === 'textarea'}
            rows={question.question_type === 'textarea' ? 3 : 1}
          />
        );
        
      default:
        return <Typography color="error">Unsupported question type: {question.question_type}</Typography>;
    }
   };

  if (loading) {
    return (
      <Box sx={{ py: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
        <CircularProgress size={22} thickness={4} />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Loading this care topic...
        </Typography>
      </Box>
    );
  }
  if (error) return <Alert severity="error" sx={{ borderRadius: 2.5 }}>{error}</Alert>;
  if (!questions.length) {
    return (
      <Alert
        severity="success"
        sx={{
          my: 2,
          borderRadius: 3,
          border: `1px solid ${alpha('#22C55E', 0.2)}`,
          bgcolor: alpha('#22C55E', isDarkMode ? 0.1 : 0.06),
        }}
      >
        All questions completed for this symptom.
      </Alert>
    );
  }

  return (
    <Stack spacing={2.5} mt={1}>
      {questions.map((question, qIndex) => (
        <Paper
          key={question._id}
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 3,
            position: 'relative',
            background: (theme) => alpha(theme.palette.background.paper, isDarkMode ? 0.48 : 0.86),
            backdropFilter: 'blur(12px)',
            border: `1px solid ${alpha('#0EA5E9', isDarkMode ? 0.16 : 0.12)}`,
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              borderColor: alpha('#0EA5E9', 0.28),
              boxShadow: `0 12px 30px ${alpha('#0f172a', isDarkMode ? 0.25 : 0.06)}`,
            },
          }}
        >
          <Box position="relative" zIndex={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5} sx={{ mb: 1.4 }}>
              <Chip
                label={`Question ${qIndex + 1} of ${questions.length}`}
                size="small"
                sx={{ height: 24, fontSize: '0.7rem', fontWeight: 800, color: '#0e7490', bgcolor: alpha('#22D3EE', 0.12) }}
              />
              {answeredIds.includes(question._id) && (
                <Chip
                  label="Completed"
                  size="small"
                  sx={{ height: 24, fontSize: '0.7rem', fontWeight: 800, color: '#4D7C0F', bgcolor: alpha('#84CC16', 0.14) }}
                />
              )}
            </Stack>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5} gap={1}>
              <FormControl fullWidth>
                <FormLabel
                  sx={{
                    fontWeight: 850,
                    fontSize: { xs: '1rem', md: '1.08rem' },
                    mb: 1.2,
                    lineHeight: 1.45,
                    color: 'text.primary',
                  }}
                >
                  {question.question_text}
                </FormLabel>
                {renderQuestion(question)}
              </FormControl>
              {success[question._id] && (
                <Chip
                  label="Saved"
                  color="success"
                  size="small"
                  sx={{ ml: 2, fontWeight: 600 }}
                />
              )}
            </Box>
            <Box mt={0.5}>
              {saveError[question._id] && (
                <Typography color="error.main" fontWeight={500} variant="body2">
                  {saveError[question._id]}
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      ))}
      {/* Save button removed - auto-save handled by Next button in parent */}
      {questions.length > 0 && questions.every((q) => answeredIds.includes(q._id)) && (
        <Box mt={2}>
          <Alert severity="info" sx={{ borderRadius: 2, border: (t) => `1px solid ${alpha(t.palette.info.main, 0.2)}` }}>
            You&apos;ve already completed this topic. When you&apos;re ready, use <strong>Next topic</strong> below.
          </Alert>
        </Box>
      )}
      {globalSuccess && (
        <Box mt={2}>
          <Alert severity="success" sx={{ borderRadius: 2 }}>All answers saved successfully!</Alert>
        </Box>
      )}
      {globalError && (
        <Box mt={2}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>{globalError}</Alert>
        </Box>
      )}
    </Stack>
  );
});

export default QuestionList; 
