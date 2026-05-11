import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';

export default function ShortcutsDialog({ open, onClose }) {
  const shortcuts = [
    { key: '?', description: 'Show keyboard shortcuts' },
    { key: 'r', description: 'Refresh dashboard data' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <KeyboardIcon />
          <Typography variant="h6">Keyboard Shortcuts</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {shortcuts.map((shortcut, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
              }}
            >
              <Typography variant="body2">{shortcut.description}</Typography>
              <Chip
                label={shortcut.key}
                size="small"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  minWidth: 40,
                }}
              />
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
