import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  alpha,
  CircularProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import axiosInstance from '../../utils/axiosInstance'; // Use central axios instance

// NOTE: Using central axiosInstance from utils to avoid duplicate interceptors

const AssessmentSummaryStep = ({ onComplete, answers, isLoggedIn }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Fetch the user's disease data summary
        const response = await axiosInstance.get('/users/my-disease-data');
        setSummary(response.data.data);
      } catch (err) {
        console.error('Error fetching summary:', err);
        setError('Failed to load your assessment summary. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummary();
  }, [isLoggedIn]);

  const handleComplete = async () => {
    if (!isLoggedIn) {
      onComplete();
      return;
    }
    
    try {
      setSubmitting(true);
      // Mark onboarding as complete
      const resp = await axiosInstance.post('/questions/complete-onboarding');
      console.log('Complete onboarding response:', resp.status, resp.data);
      onComplete();
    } catch (err) {
      console.error('Error completing onboarding:', err);
      if (err.response) {
        console.error('Response data:', err.response.status, err.response.data);
      }
      setError('Failed to complete your assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ p: 6, textAlign: 'center', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 6, textAlign: 'center', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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

  // If not logged in, show login prompt
  if (!isLoggedIn) {
    return (
      <Box sx={{ p: 6, textAlign: 'center', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="info" sx={{ mb: 4, width: '100%' }}>
          You need to be logged in to view your complete assessment summary.
        </Alert>
        <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
          Assessment Completed
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Thank you for completing the assessment. Click the button below to finish.
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleComplete}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
            },
          }}
        >
          Finish
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 3, md: 6 } }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Success Icon */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CheckCircle 
            sx={{ 
              fontSize: 80, 
              color: theme.palette.success.main,
              filter: `drop-shadow(0 4px 20px ${alpha(theme.palette.success.main, 0.4)})`,
            }} 
          />
        </Box>
        
        {/* Title */}
        <Typography 
          variant="h4" 
          fontWeight={700} 
          color="text.primary" 
          align="center"
          gutterBottom
        >
          Assessment Complete!
        </Typography>
        
        <Typography 
          variant="h6" 
          color="text.secondary" 
          align="center"
          sx={{ mb: 6 }}
        >
          Thank you for providing your health information. Here's a summary of what you've shared.
        </Typography>
        
        {/* Summary Card */}
        <Paper
          elevation={4}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            mb: 4,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <Typography variant="h6" fontWeight={600} color="primary">
              Assessment Summary
            </Typography>
          </Box>
          
          <Divider />
          
          <Box sx={{ p: 3 }}>
            {summary ? (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} color="text.primary" gutterBottom>
                    Disease: {summary.disease}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated: {new Date(summary.lastUpdated).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Questions Answered: {summary.answeredQuestions} of {summary.totalQuestions}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" fontWeight={600} color="text.primary" gutterBottom>
                  Symptoms Information
                </Typography>
                
                {summary.symptoms.map((symptom, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight={600} color="primary.main" gutterBottom>
                      {symptom.name}
                    </Typography>
                    
                    <List dense disablePadding>
                      {symptom.questions.map((q, i) => (
                        <ListItem key={i} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={q.question}
                            secondary={q.answer}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ))}
              </>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center">
                No summary data available.
              </Typography>
            )}
          </Box>
        </Paper>
        
        {/* Complete Button */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleComplete}
            disabled={submitting}
            endIcon={<ArrowForward />}
            sx={{
              py: 2,
              px: 6,
              fontSize: '1.1rem',
              borderRadius: 3,
              fontWeight: 600,
              textTransform: 'none',
              background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
                boxShadow: `0 12px 40px ${alpha(theme.palette.success.main, 0.4)}`,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {submitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Complete Assessment'
            )}
          </Button>
        </Box>
      </motion.div>
    </Box>
  );
};

export default AssessmentSummaryStep;
