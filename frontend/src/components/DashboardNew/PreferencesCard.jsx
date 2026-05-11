import React, { useEffect, useState } from 'react';
import { Paper, Box, Typography, Switch, FormControlLabel } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ThemeToggle from '../Common/ThemeToggle';

const PreferencesCard = () => {
  const [emailNotifs, setEmailNotifs] = useState(() => {
    const saved = localStorage.getItem('pref_email_notifications');
    return saved ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('pref_email_notifications', String(emailNotifs));
  }, [emailNotifs]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 4,
        background: (t) => `linear-gradient(135deg, ${t.palette.background.paper}, ${alpha(t.palette.info.main, 0.04)})`,
        border: (t) => `2px solid ${alpha(t.palette.info.main, 0.15)}`,
      }}
    >
      <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>Preferences</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">Theme</Typography>
        <ThemeToggle size="small" />
      </Box>
      <FormControlLabel 
        control={<Switch checked={emailNotifs} onChange={(e)=>setEmailNotifs(e.target.checked)} />} 
        label="Email notifications"
      />
    </Paper>
  );
};

export default PreferencesCard;
