import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, FormControl, InputLabel, Select, MenuItem, CircularProgress, List, ListItem, ListItemText, IconButton, ListItemSecondaryAction, Chip, Stack, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { fetchDiseases, fetchSymptomsByDisease, fetchQuestionsBySymptom, addQuestion, updateQuestion, deleteQuestion } from '../utils/api';
import QuestionForm from './QuestionForm';
import ConfirmDialog from './ConfirmDialog';

export default function ManageQuestions() {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisease, setSelectedDisease] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [symptomLoading, setSymptomLoading] = useState(false);
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [questions, setQuestions] = useState([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    const loadDiseases = async () => {
      setLoading(true);
      try {
        const data = await fetchDiseases();
        console.log('Diseases loaded (questions):', data);
        setDiseases(data);
        if (data && data.length > 0) {
          setSelectedDisease(data[0]._id);
        }
      } catch (err) {
        console.error('Error loading diseases (questions):', err);
      }
      setLoading(false);
    };
    loadDiseases();
  }, []);

  useEffect(() => {
    if (selectedDisease) {
      console.log('Selected disease ID (questions):', selectedDisease);
      setSymptomLoading(true);
      fetchSymptomsByDisease(selectedDisease)
        .then(data => {
          console.log('Symptoms fetched (questions):', data);
          setSymptoms(data);
          // Auto-select the first symptom if available
          if (data && data.length > 0) {
            setSelectedSymptom(data[0]._id);
          }
          setSymptomLoading(false);
        })
        .catch(err => {
          console.error('Error fetching symptoms (questions):', err);
          setSymptoms([]);
          setSymptomLoading(false);
        });
    } else {
      setSymptoms([]);
      setSelectedSymptom('');
    }
  }, [selectedDisease]);

  useEffect(() => {
    if (selectedSymptom) {
      console.log('Fetching questions for symptom:', selectedSymptom);
      setQuestionLoading(true);
      fetchQuestionsBySymptom(selectedSymptom).then(data => {
        console.log('Questions fetched:', data);
        setQuestions(data);
        setQuestionLoading(false);
      }).catch(err => {
        console.error('Error fetching questions:', err);
        setQuestions([]);
        setQuestionLoading(false);
      });
    } else {
      setQuestions([]);
    }
  }, [selectedSymptom]);

  const handleAdd = () => {
    setEditData(null);
    setFormOpen(true);
  };

  const handleEdit = (question) => {
    setEditData(question);
    setFormOpen(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setFormOpen(false);
    if (editData) {
      await updateQuestion(editData._id, data);
    } else {
      await addQuestion(selectedSymptom, data);
    }
    const updated = await fetchQuestionsBySymptom(selectedSymptom);
    setQuestions(updated);
  };

  const handleConfirmDelete = async () => {
    setConfirmOpen(false);
    if (deleteId) {
      await deleteQuestion(deleteId);
      setDeleteId(null);
      const updated = await fetchQuestionsBySymptom(selectedSymptom);
      setQuestions(updated);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Manage Questions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add, edit, or remove questions for symptoms
        </Typography>
      </Box>

      {/* Disease Selection */}
      <Box sx={{ mb: 2 }}>
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

      {/* Symptom Selection */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth disabled={!selectedDisease}>
          <InputLabel>Select Symptom</InputLabel>
          <Select
            label="Select Symptom"
            value={symptoms.map(s=>s._id).includes(selectedSymptom) ? selectedSymptom : (symptoms[0]?._id || '')}
            onChange={e => setSelectedSymptom(e.target.value)}
            disabled={symptomLoading || !selectedDisease || symptoms.length === 0}
          >
            {symptomLoading ? (
              <MenuItem value=""><CircularProgress size={20} /></MenuItem>
            ) : symptoms.length === 0 ? (
              <MenuItem value="" disabled>No symptoms found</MenuItem>
            ) : (
              symptoms.map(symptom => (
                <MenuItem key={symptom._id} value={symptom._id}>{symptom.name}</MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </Box>

      {/* Action Button */}
      {selectedSymptom && (
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
            Add Question
          </Button>
        </Box>
      )}

      {/* Content */}
      {selectedSymptom && (
        <>
          {questionLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : questions.length === 0 ? (
            <Paper 
              sx={{ 
                p: 6, 
                textAlign: 'center',
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                border: (t) => `1px dashed ${t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No questions found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add questions for this symptom
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
                Add Question
              </Button>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {questions.map((question) => {
                const hasMlMapping = question.ml_feature_mapping && question.ml_feature_mapping.feature_name;
                const isRequired = question.ml_feature_mapping?.is_required;
                const hasRenderConfig = question.render_config && question.render_config.type !== 'default';
                
                return (
                  <Paper 
                    key={question._id}
                    sx={{ 
                      p: 2.5,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      borderLeft: hasMlMapping ? '4px solid' : 'none',
                      borderLeftColor: isRequired ? 'success.main' : 'info.main',
                      '&:hover': {
                        boxShadow: (t) => t.palette.mode === 'dark' 
                          ? '0 4px 12px rgba(0,0,0,0.3)' 
                          : '0 4px 12px rgba(0,0,0,0.08)',
                      }
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        {question.question_text}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Type: {question.question_type === 'text' ? 'Text Field' :
                               question.question_type === 'number' ? 'Number Field' :
                               question.question_type === 'radio' ? 'Radio Buttons' :
                               question.question_type === 'dropdown' ? 'Dropdown' :
                               question.question_type === 'checkbox' ? 'Checkboxes' :
                               question.question_type}
                        {question.options && question.options.length > 0 && (
                          <span> • Options: {question.options.join(', ')}</span>
                        )}
                      </Typography>
                      
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {hasMlMapping ? (
                          <>
                            <Chip 
                              icon={<CheckCircleIcon />}
                              label={`ML: ${question.ml_feature_mapping.feature_name}`}
                              size="small"
                              color={isRequired ? 'success' : 'info'}
                              variant="outlined"
                            />
                            {isRequired && (
                              <Chip 
                                label="Required for Assessment" 
                                size="small" 
                                color="success"
                              />
                            )}
                            {question.ml_feature_mapping.transformation && question.ml_feature_mapping.transformation !== 'none' && (
                              <Chip 
                                label={`Transform: ${question.ml_feature_mapping.transformation}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </>
                        ) : (
                          <Chip 
                            icon={<WarningIcon />}
                            label="No ML Mapping"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                        
                        {hasRenderConfig && (
                          <Chip 
                            label={`Custom Render: ${question.render_config.type}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleEdit(question)}
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
                        onClick={() => handleDelete(question._id)}
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
                );
              })}
              
              {/* ML Feature Coverage Summary */}
              {questions.length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    ML Integration Status:
                  </Typography>
                  <Typography variant="body2">
                    • Questions with ML mapping: <strong>{questions.filter(q => q.ml_feature_mapping?.feature_name).length} / {questions.length}</strong>
                    <br />
                    • Required questions: <strong>{questions.filter(q => q.ml_feature_mapping?.is_required).length}</strong>
                    <br />
                    • Custom rendering: <strong>{questions.filter(q => q.render_config && q.render_config.type !== 'default').length}</strong>
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </>
      )}

      <QuestionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editData}
      />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Question"
        message="Are you sure you want to delete this question?"
      />
    </Box>
  );
} 
