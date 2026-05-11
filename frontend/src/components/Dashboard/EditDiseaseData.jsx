import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  TextField,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  Done as DoneIcon
} from '@mui/icons-material';
import { fetchDiseaseDataForEditing, updateDiseaseDataAnswer, submitDiseaseData } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';

const EditDiseaseData = ({ onClose, onDataUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diseaseData, setDiseaseData] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState('');
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  useEffect(() => {
    loadDiseaseData();
  }, []);

  const loadDiseaseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDiseaseDataForEditing();
      setDiseaseData(data);
      
      if (data.diseases && data.diseases.length > 0) {
        setSelectedDisease(data.diseases[0]._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load disease data');
    } finally {
      setLoading(false);
    }
  };

  const handleDiseaseChange = (diseaseId) => {
    setSelectedDisease(diseaseId);
    setSelectedSymptom('');
    setSelectedQuestion(null);
    setAnswers({});
  };

  const handleSymptomChange = (symptomId) => {
    setSelectedSymptom(symptomId);
    setSelectedQuestion(null);
    setAnswers({});
  };

  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    setAnswers({ [question._id]: question.current_answer });
  };

  const handleInputChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSaveAnswer = async () => {
    if (!selectedQuestion || !answers[selectedQuestion._id]) return;

    try {
      setSaving(true);
      await updateDiseaseDataAnswer(selectedQuestion._id, answers[selectedQuestion._id]);
      
      // Update the local data
      const updatedDiseases = diseaseData.diseases.map(disease => {
        if (disease._id === selectedDisease) {
          return {
            ...disease,
            symptoms: Object.keys(disease.symptoms).reduce((acc, symptomId) => {
              acc[symptomId] = {
                ...disease.symptoms[symptomId],
                questions: disease.symptoms[symptomId].questions.map(q => 
                  q._id === selectedQuestion._id 
                    ? { ...q, current_answer: answers[selectedQuestion._id] }
                    : q
                )
              };
              return acc;
            }, {})
          };
        }
        return disease;
      });
      
      setDiseaseData(prev => ({ ...prev, diseases: updatedDiseases }));
      setSelectedQuestion(null);
      setAnswers({});
      
      if (onDataUpdated) {
        onDataUpdated();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save answer');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitData = async () => {
    try {
      setSaving(true);
      await submitDiseaseData();
      setShowSubmitDialog(false);
      if (onClose) onClose();
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit disease data');
    } finally {
      setSaving(false);
    }
  };

  const renderQuestionInput = (question) => {
    const value = answers[question._id] || question.current_answer || '';

    switch (question.question_type) {
      case 'radio':
        return (
          <RadioGroup
            value={value}
            onChange={(e) => handleInputChange(question._id, e.target.value)}
          >
            {question.options.map((option) => (
              <FormControlLabel
                key={option}
                value={option}
                control={<Radio />}
                label={option}
              />
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        const selectedValues = value ? (Array.isArray(value) ? value : [value]) : [];
        return (
          <FormGroup>
            {question.options.map((option) => (
              <FormControlLabel
                key={option}
                control={
                  <Checkbox
                    checked={selectedValues.includes(option)}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...selectedValues, option]
                        : selectedValues.filter(v => v !== option);
                      handleInputChange(question._id, newValues);
                    }}
                  />
                }
                label={option}
              />
            ))}
          </FormGroup>
        );

      case 'dropdown':
        return (
          <FormControl fullWidth>
            <Select
              value={value}
              onChange={(e) => handleInputChange(question._id, e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled>Select an option</MenuItem>
              {question.options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'range':
        return (
          <Box>
            <Slider
              value={parseInt(value) || 0}
              onChange={(e, newValue) => handleInputChange(question._id, newValue.toString())}
              min={0}
              max={10}
              marks
              valueLabelDisplay="auto"
            />
            <Typography variant="body2" color="text.secondary">
              Value: {value || 0}
            </Typography>
          </Box>
        );

      case 'text':
        return (
          <TextField
            fullWidth
            value={value}
            onChange={(e) => handleInputChange(question._id, e.target.value)}
            multiline
            rows={3}
            placeholder="Enter your answer..."
          />
        );

      default:
        return (
          <TextField
            fullWidth
            value={value}
            onChange={(e) => handleInputChange(question._id, e.target.value)}
            placeholder="Enter your answer..."
          />
        );
    }
  };

  const getTimeRemaining = () => {
    if (!diseaseData?.editingWindow?.expiresAt) return null;
    const now = new Date();
    const expiresAt = new Date(diseaseData.editingWindow.expiresAt);
    const timeLeft = expiresAt - now;
    
    if (timeLeft <= 0) return 'Expired';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!diseaseData?.diseases || diseaseData.diseases.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="info">
          No disease data found. Please complete your details first.
        </Alert>
      </Box>
    );
  }

  const selectedDiseaseData = diseaseData.diseases.find(d => d._id === selectedDisease);
  const selectedSymptomData = selectedDiseaseData?.symptoms[selectedSymptom];

  return (
    <Box>
      {/* Header with editing window info */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Edit Disease Data
        </Typography>
        
        {diseaseData.editingWindow && (
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Chip
              icon={diseaseData.editingWindow.status === 'draft' ? <EditIcon /> : <DoneIcon />}
              label={diseaseData.editingWindow.status === 'draft' ? 'Draft' : 'Submitted'}
              color={diseaseData.editingWindow.status === 'draft' ? 'warning' : 'success'}
            />
            
            {diseaseData.editingWindow.status === 'draft' && (
              <>
                <Chip
                  icon={<AccessTimeIcon />}
                  label={`Time remaining: ${getTimeRemaining()}`}
                  color={getTimeRemaining() === 'Expired' ? 'error' : 'info'}
                />
                
                {diseaseData.editingWindow.canEdit && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => setShowSubmitDialog(true)}
                    startIcon={<DoneIcon />}
                  >
                    Submit Data
                  </Button>
                )}
              </>
            )}
          </Box>
        )}

        {!diseaseData.editingWindow?.canEdit && diseaseData.editingWindow?.status === 'draft' && (
          <Alert severity="warning" icon={<WarningIcon />}>
            Editing window has expired. Your disease data has been automatically submitted.
          </Alert>
        )}
      </Box>

      {/* Selection Controls */}
      <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Select Data to Edit
          </Typography>
          
          <Box display="flex" gap={2} flexWrap="wrap">
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Disease</InputLabel>
              <Select
                value={selectedDisease}
                onChange={(e) => handleDiseaseChange(e.target.value)}
                label="Disease"
              >
                {diseaseData.diseases.map((disease) => (
                  <MenuItem key={disease._id} value={disease._id}>
                    {disease.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedDisease && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Symptom</InputLabel>
                <Select
                  value={selectedSymptom}
                  onChange={(e) => handleSymptomChange(e.target.value)}
                  label="Symptom"
                >
                  {Object.values(selectedDiseaseData.symptoms).map((symptom) => (
                    <MenuItem key={symptom._id} value={symptom._id}>
                      {symptom.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Questions List */}
      {selectedSymptomData && (
        <Card elevation={2} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {selectedSymptomData.name} - Questions
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2}>
              {selectedSymptomData.questions.map((question) => (
                <Card
                  key={question._id}
                  elevation={1}
                  sx={{
                    borderRadius: 2,
                    border: selectedQuestion?._id === question._id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: '#1976d2',
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)'
                    }
                  }}
                  onClick={() => handleQuestionSelect(question)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {question.question_text}
                      </Typography>
                      <Chip
                        label={question.current_answer}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    
                    {selectedQuestion?._id === question._id && (
                      <Box mt={2}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Edit your answer:
                        </Typography>
                        {renderQuestionInput(question)}
                        
                        <Box display="flex" justifyContent="flex-end" mt={2}>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSaveAnswer}
                            disabled={saving || !answers[question._id]}
                            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                          >
                            {saving ? 'Saving...' : 'Save Answer'}
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Submit Disease Data
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit your disease data? Once submitted, you will no longer be able to edit it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitData}
            variant="contained"
            color="success"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <DoneIcon />}
          >
            {saving ? 'Submitting...' : 'Submit Data'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EditDiseaseData; 
