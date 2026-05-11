import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

export default function CheckRiskSection() {
  const navigate = useNavigate();

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        background: (t) => t.palette.background.paper,
        border: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Box 
          sx={{ 
            width: 48,
            height: 48,
            borderRadius: '16px',
            background: (t) => alpha(t.palette.primary.main, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
          }}
        >
          ✅
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800}>View Assessment / Check My Risk</Typography>
          <Typography variant="body1" color="text.secondary">
            Run the guided assessment to understand your diabetes risk and track past assessments.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/assessment')}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            px: 3,
            py: 1.5,
            flex: 1,
          }}
        >
          Check my risk now
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate('/onboarding')}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            px: 3,
            py: 1.5,
            flex: 1,
          }}
        >
          Update My Data
        </Button>
      </Box>
    </Paper>
  );
}
