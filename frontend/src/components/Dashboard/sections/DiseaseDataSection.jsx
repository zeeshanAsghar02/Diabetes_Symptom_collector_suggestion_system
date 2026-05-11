import React from 'react';
import { Box, Paper, Typography, Button, CircularProgress, Alert, Chip, Divider, LinearProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';

export default function DiseaseDataSection({ 
  loading, 
  error, 
  diseaseData, 
  completionPct, 
  handleEditDiseaseData 
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ borderRadius: 4 }}>{error}</Alert>;
  }

  if (!diseaseData || !diseaseData.disease) {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 5, 
          borderRadius: 3,
          textAlign: 'center',
          background: (t) => t.palette.background.paper,
          border: (t) => `1px dashed ${t.palette.divider}`,
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Box 
            sx={{ 
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: (t) => alpha(t.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              fontSize: '4rem',
            }}
          >
            📋
          </Box>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5 }}>
            No Disease Data Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            You haven't filled your health details yet. Start your onboarding journey to get personalized insights and track your health.
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate('/onboarding')} 
            sx={{ 
              borderRadius: 2, 
              fontWeight: 800,
              px: 4,
              py: 1.4,
            }}
          >
            Start Onboarding
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          borderRadius: 3,
          background: (t) => t.palette.background.paper,
          border: (t) => `1px solid ${t.palette.divider}`,
          mb: 3,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h6" fontWeight={800}>
            Health Profile
          </Typography>
          {diseaseData?.disease && (
            <Button 
              variant="contained" 
              startIcon={<EditIcon />} 
              onClick={handleEditDiseaseData} 
              sx={{ 
                borderRadius: 2, 
                fontWeight: 800,
              }}
            >
              Edit Data
            </Button>
          )}
        </Box>
        
        {/* Progress Bar */}
        {typeof diseaseData.totalQuestions === 'number' && diseaseData.totalQuestions > 0 && (
          <Box 
            sx={{ 
              mb: 4, 
              p: 3, 
              borderRadius: 3,
              background: (t) => alpha(t.palette.primary.main, 0.04),
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                Onboarding Progress
              </Typography>
              <Chip 
                label={completionPct === 100 ? 'Complete' : 'In Progress'} 
                color={completionPct === 100 ? 'success' : 'primary'}
                size="small"
                sx={{ fontWeight: 800 }}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={completionPct}
                  sx={{ 
                    height: 12, 
                    borderRadius: 6,
                    background: (t) => alpha(t.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 6,
                      background: (t) => t.palette.primary.main,
                    }
                  }}
                />
              </Box>
              <Typography variant="h6" fontWeight={900} color="primary.main">
                {completionPct}%
              </Typography>
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* Disease/Symptoms Info - Questions & Answers */}
        {diseaseData.symptoms?.length ? (
          <Box>
            <Typography variant="h6" fontWeight={900} sx={{ mb: 3 }}>
              Symptom Details
            </Typography>
            {diseaseData.symptoms.map((symptom, idx) => (
              <Box key={idx} sx={{ mb: 3 }}>
                {/* Symptom Name Header */}
                <Typography 
                  variant="subtitle1" 
                  fontWeight={700} 
                  sx={{ 
                    mb: 1.5,
                    color: 'primary.main',
                    textTransform: 'uppercase',
                    fontSize: '0.9rem',
                    letterSpacing: 0.5
                  }}
                >
                  {symptom.name || 'Unknown Symptom'}
                </Typography>
                
                {/* Questions under this symptom */}
                {symptom.questions?.map((qa, qIdx) => (
                  <Box 
                    key={qIdx}
                    sx={{ 
                      mb: 1.5,
                      p: 2,
                      borderRadius: 2,
                      background: (t) => alpha(t.palette.action.hover, 0.02),
                      border: (t) => `1px solid ${t.palette.divider}`,
                    }}
                  >
                    <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                      {qa.question || 'Question not available'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Answer: {qa.answer || 'No answer provided'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No symptoms recorded yet.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
