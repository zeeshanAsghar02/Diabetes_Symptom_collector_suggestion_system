import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, List, ListItem, ListItemText, IconButton, ListItemSecondaryAction, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { fetchDiseases, addDisease, updateDisease, deleteDisease } from '../utils/api';
import DiseaseForm from './DiseaseForm';
import ConfirmDialog from './ConfirmDialog';

export default function ManageDiseases() {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const loadDiseases = async () => {
    setLoading(true);
    try {
      const data = await fetchDiseases();
      setDiseases(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiseases();
  }, []);

  const handleAdd = () => {
    setEditData(null);
    setFormOpen(true);
  };

  const handleEdit = (disease) => {
    setEditData(disease);
    setFormOpen(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setFormOpen(false);
    if (editData) {
      await updateDisease(editData._id, data);
    } else {
      await addDisease(data);
    }
    loadDiseases();
  };

  const handleConfirmDelete = async () => {
    setConfirmOpen(false);
    if (deleteId) {
      await deleteDisease(deleteId);
      setDeleteId(null);
      loadDiseases();
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Manage Diseases
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add, edit, or remove diseases from the system
        </Typography>
      </Box>

      {/* Action Button */}
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
          Add Disease
        </Button>
      </Box>

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : diseases.length === 0 ? (
        <Paper 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
            border: (t) => `1px dashed ${t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No diseases found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Get started by adding your first disease
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Add Disease
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {diseases.map((disease) => (
            <Paper 
              key={disease._id}
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
                  {disease.name}
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
                  {disease.description}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                <IconButton 
                  color="primary" 
                  onClick={() => handleEdit(disease)}
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
                  onClick={() => handleDelete(disease._id)}
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

      <DiseaseForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editData}
      />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Disease"
        message="Are you sure you want to delete this disease? This will also delete all related symptoms and questions."
      />
    </Box>
  );
} 
