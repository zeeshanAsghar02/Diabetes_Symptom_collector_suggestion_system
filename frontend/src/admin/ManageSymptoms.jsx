import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, FormControl, InputLabel, Select, MenuItem, CircularProgress, List, ListItem, ListItemText, IconButton, ListItemSecondaryAction } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { fetchDiseases, fetchSymptomsByDisease, addSymptom, updateSymptom, deleteSymptom } from '../utils/api';
import SymptomForm from './SymptomForm';
import ConfirmDialog from './ConfirmDialog';

export default function ManageSymptoms() {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisease, setSelectedDisease] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [symptomLoading, setSymptomLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDiseases = async () => {
      setLoading(true);
      try {
        const data = await fetchDiseases();
        console.log('Diseases loaded:', data);
        setDiseases(data);
        if (data && data.length > 0) {
          setSelectedDisease(data[0]._id);
        }
      } catch (err) {
        console.error('Error loading diseases:', err);
      }
      setLoading(false);
    };
    loadDiseases();
  }, []);

  useEffect(() => {
    if (selectedDisease) {
      console.log('Selected disease ID:', selectedDisease);
      setSymptomLoading(true);
      setError(null);
      fetchSymptomsByDisease(selectedDisease)
        .then(data => {
          console.log('Symptoms fetched:', data);
          setSymptoms(data);
          setSymptomLoading(false);
        })
        .catch(err => {
          console.error('Error fetching symptoms:', err);
          setError('Failed to fetch symptoms.');
          setSymptoms([]);
          setSymptomLoading(false);
        });
    } else {
      setSymptoms([]);
      setError(null);
    }
  }, [selectedDisease]);

  const handleAdd = () => {
    setEditData(null);
    setFormOpen(true);
  };

  const handleEdit = (symptom) => {
    setEditData(symptom);
    setFormOpen(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setFormOpen(false);
    if (editData) {
      await updateSymptom(editData._id, data);
    } else {
      await addSymptom(selectedDisease, data);
    }
    const updated = await fetchSymptomsByDisease(selectedDisease);
    setSymptoms(updated);
  };

  const handleConfirmDelete = async () => {
    setConfirmOpen(false);
    if (deleteId) {
      await deleteSymptom(deleteId);
      setDeleteId(null);
      const updated = await fetchSymptomsByDisease(selectedDisease);
      setSymptoms(updated);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Manage Symptoms
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add, edit, or remove symptoms for diseases
        </Typography>
      </Box>

      {/* Disease Selection */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Select Disease</InputLabel>
          <Select
            label="Select Disease"
            value={diseases.map(d=>d._id).includes(selectedDisease) ? selectedDisease : (diseases[0]?._id || '')}
            onChange={e => setSelectedDisease(e.target.value)}
            disabled={loading || diseases.length === 0}
          >
            {loading ? (
              <MenuItem value=""><CircularProgress size={20} /></MenuItem>
            ) : diseases.length === 0 ? (
              <MenuItem value="" disabled>No diseases found</MenuItem>
            ) : (
              diseases.map(disease => (
                <MenuItem key={disease._id} value={disease._id}>{disease.name}</MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </Box>

      {/* Action Button */}
      {selectedDisease && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={handleAdd}
            sx={{ 
              fontWeight: 600,
              px: 3,
              py: 1,
            }}
          >
            Add Symptom
          </Button>
        </Box>
      )}

      {/* Content */}
      {selectedDisease && (
        <>
          {symptomLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Paper 
              sx={{ 
                p: 4, 
                textAlign: 'center',
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(244,67,54,0.05)' : 'rgba(211,47,47,0.05)',
                border: (t) => `1px solid ${t.palette.mode === 'dark' ? 'rgba(244,67,54,0.2)' : 'rgba(211,47,47,0.2)'}`,
              }}
            >
              <Typography color="error">{error}</Typography>
            </Paper>
          ) : symptoms.length === 0 ? (
            <Paper 
              sx={{ 
                p: 6, 
                textAlign: 'center',
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                border: (t) => `1px dashed ${t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No symptoms found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add symptoms for this disease
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
                Add Symptom
              </Button>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {symptoms.map((symptom) => (
                <Paper 
                  key={symptom._id}
                  sx={{ 
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: (t) => t.palette.mode === 'dark' 
                        ? '0 4px 12px rgba(0,0,0,0.3)' 
                        : '0 4px 12px rgba(0,0,0,0.08)',
                    }
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      {symptom.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {symptom.description}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEdit(symptom)}
                      sx={{ 
                        '&:hover': { 
                          bgcolor: (t) => t.palette.mode === 'dark' 
                            ? 'rgba(144, 202, 249, 0.08)' 
                            : 'rgba(25, 118, 210, 0.08)' 
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(symptom._id)}
                      sx={{ 
                        '&:hover': { 
                          bgcolor: (t) => t.palette.mode === 'dark' 
                            ? 'rgba(244, 67, 54, 0.08)' 
                            : 'rgba(211, 47, 47, 0.08)' 
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </>
      )}

      <SymptomForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editData}
      />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Symptom"
        message="Are you sure you want to delete this symptom? This will also delete all related questions."
      />
    </Box>
  );
} 
