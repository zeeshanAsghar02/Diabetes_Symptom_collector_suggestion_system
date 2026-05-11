import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';

export default function GoalDialog({ open, goal, onSave, onClose }) {
  const [formData, setFormData] = React.useState({
    title: '',
    target: '',
    current: 0,
    unit: '',
    ...goal,
  });

  React.useEffect(() => {
    if (goal) {
      setFormData(goal);
    } else {
      setFormData({ title: '', target: '', current: 0, unit: '' });
    }
  }, [goal, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.target) return;
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{goal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Goal Title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            fullWidth
          />
          <TextField
            label="Target Value"
            type="number"
            value={formData.target}
            onChange={(e) => handleChange('target', e.target.value)}
            fullWidth
          />
          <TextField
            label="Current Progress"
            type="number"
            value={formData.current}
            onChange={(e) => handleChange('current', e.target.value)}
            fullWidth
          />
          <TextField
            label="Unit (e.g., kg, steps, minutes)"
            value={formData.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!formData.title || !formData.target}
        >
          {goal ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
