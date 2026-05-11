import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

export default function DiseaseForm({ open, onClose, onSubmit, initialData }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [symptomsDescription, setSymptomsDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setSymptomsDescription(initialData.symptoms_description || '');
    } else {
      setName('');
      setDescription('');
      setSymptomsDescription('');
    }
  }, [initialData, open]);

  const handleSubmit = () => {
    onSubmit({ name, description, symptoms_description: symptomsDescription });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Edit Disease' : 'Add Disease'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Disease Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          minRows={2}
        />
        <TextField
          label="Symptoms Description (optional)"
          value={symptomsDescription}
          onChange={e => setSymptomsDescription(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          minRows={2}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">{initialData ? 'Update' : 'Add'}</Button>
      </DialogActions>
    </Dialog>
  );
} 
