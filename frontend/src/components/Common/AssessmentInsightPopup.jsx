import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 18,
    padding: theme.spacing(3),
    minWidth: 420,
    maxWidth: 520,
  },
}));

const AssessmentInsightPopup = ({
  open,
  riskLevel,
  probability,
  assessedAt,
  onSelectAnswer,
}) => {
  const prettyRisk = riskLevel
    ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).toLowerCase()
    : 'Unknown';

  const probPercent = probability != null ? Math.round(Number(probability) * 100) : null;

  const getRiskColor = () => {
    const level = (riskLevel || '').toLowerCase();
    if (level === 'low') return 'success';
    if (level === 'medium') return 'warning';
    return 'error';
  };

  return (
    <StyledDialog
      open={open}
      aria-labelledby="assessment-insight-dialog-title"
      aria-describedby="assessment-insight-dialog-description"
    >
      <DialogTitle id="assessment-insight-dialog-title">
        <Typography variant="h5" fontWeight={800} textAlign="center">
          Your latest diabetes risk insight
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 1.5 }}>
          <Box textAlign="center" mb={2}>
            <Chip
              label={`Risk level: ${prettyRisk}`}
              color={getRiskColor()}
              sx={{
                fontWeight: 800,
                px: 1.5,
                mb: 1,
              }}
            />
            {probPercent !== null && (
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Estimated probability: {probPercent}%
              </Typography>
            )}
            {assessedAt && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                Based on your symptom assessment from{' '}
                {new Date(assessedAt).toLocaleString()}
              </Typography>
            )}
          </Box>

          <Typography
            id="assessment-insight-dialog-description"
            variant="body1"
            color="text.secondary"
            sx={{ mb: 2, textAlign: 'center' }}
          >
            This assessment estimates your chance of having diabetes using your
            answers. It helps you decide when to get checked, but it cannot
            confirm whether you have diabetes.
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.primary" fontWeight={600} sx={{ mb: 0.5 }}>
              What should you do next?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We strongly recommend booking blood tests for diabetes (such as
              fasting blood sugar or HbA1c) and discussing these results with a
              healthcare professional.
            </Typography>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 2, textAlign: 'center' }}
          >
            This tool is not a diagnosis and does not replace medical advice.
          </Typography>

          <Box sx={{ mt: 1 }}>
            <Typography
              variant="subtitle2"
              fontWeight={800}
              color="text.primary"
              sx={{ mb: 1, textAlign: 'center' }}
            >
              Have you already had tests and received a diagnosis for diabetes?
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', gap: 1.5, pb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => onSelectAnswer('diagnosed_diabetic')}
          sx={{
            borderRadius: 2,
            fontWeight: 800,
            textTransform: 'none',
            py: 1.4,
          }}
        >
          Yes – I have been diagnosed with diabetes
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => onSelectAnswer('diagnosed_not_diabetic')}
          sx={{
            borderRadius: 2,
            fontWeight: 800,
            textTransform: 'none',
            py: 1.2,
          }}
        >
          Yes – I had tests and was told I am not diabetic
        </Button>
        <Button
          fullWidth
          variant="text"
          onClick={() => onSelectAnswer('not_tested_yet')}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            textTransform: 'none',
            py: 1,
          }}
        >
          Not yet – I have not had tests for diabetes
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default AssessmentInsightPopup;
