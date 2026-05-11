import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem, 
  Select, InputLabel, FormControl, Box, IconButton, Typography, Chip, Divider,
  FormControlLabel, Checkbox, Alert, Accordion, AccordionSummary, AccordionDetails,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';

const QUESTION_TYPES = [
  { value: 'text', label: 'Text Field' },
  { value: 'number', label: 'Number Field' },
  { value: 'radio', label: 'Radio (Single Choice)' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox (Multiple Choice)' },
  { value: 'textarea', label: 'Text Area (Multi-line)' },
];

// All 16 ML features that the XGBoost model expects
const ML_FEATURES = [
  { value: '', label: 'None (not used for ML)' },
  { value: 'Age', label: 'Age', type: 'numeric' },
  { value: 'Gender', label: 'Gender', type: 'binary' },
  { value: 'Obesity', label: 'Obesity (auto-calculated from BMI)', type: 'binary', calculated: true },
  { value: 'height_cm', label: 'Height (cm) - for BMI', type: 'numeric', forCalculation: true },
  { value: 'weight_kg', label: 'Weight (kg) - for BMI', type: 'numeric', forCalculation: true },
  { value: 'Polyuria', label: 'Polyuria (Frequent Urination)', type: 'binary' },
  { value: 'Polydipsia', label: 'Polydipsia (Excessive Thirst)', type: 'binary' },
  { value: 'sudden weight loss', label: 'Sudden Weight Loss', type: 'binary' },
  { value: 'weakness', label: 'Weakness / Fatigue', type: 'binary' },
  { value: 'Polyphagia', label: 'Polyphagia (Excessive Hunger)', type: 'binary' },
  { value: 'Genital thrush', label: 'Genital Thrush', type: 'binary' },
  { value: 'visual blurring', label: 'Visual Blurring', type: 'binary' },
  { value: 'Itching', label: 'Itching', type: 'binary' },
  { value: 'Irritability', label: 'Irritability', type: 'binary' },
  { value: 'delayed healing', label: 'Delayed Healing', type: 'binary' },
  { value: 'partial paresis', label: 'Partial Paresis (Muscle Weakness)', type: 'binary' },
  { value: 'muscle stiffness', label: 'Muscle Stiffness', type: 'binary' },
  { value: 'Alopecia', label: 'Alopecia (Hair Loss)', type: 'binary' },
];

const TRANSFORMATION_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'extract_first_number', label: 'Extract First Number' },
  { value: 'yes_no_binary', label: 'Yes/No to Binary (1/0)' },
  { value: 'unit_conversion', label: 'Unit Conversion' },
];

export default function QuestionForm({ open, onClose, onSubmit, initialData }) {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('text');
  const [options, setOptions] = useState(['']);
  
  // ML Feature Mapping
  const [mlFeatureName, setMlFeatureName] = useState('');
  const [mlTransformation, setMlTransformation] = useState('none');
  const [mlIsRequired, setMlIsRequired] = useState(false);
  const [mlDefaultValue, setMlDefaultValue] = useState(0);
  const [mlValueMapping, setMlValueMapping] = useState({});
  
  // Render Config (for special rendering like height unit conversion)
  const [renderType, setRenderType] = useState('default');
  const [unitFromFeet, setUnitFromFeet] = useState([3, 4, 5, 6, 7, 8]);
  const [unitFromInches, setUnitFromInches] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

  useEffect(() => {
    if (initialData) {
      setQuestionText(initialData.question_text || '');
      setQuestionType(initialData.question_type || 'text');
      setOptions(initialData.options && initialData.options.length > 0 ? initialData.options : ['']);
      
      // Load ML mapping if exists
      if (initialData.ml_feature_mapping) {
        setMlFeatureName(initialData.ml_feature_mapping.feature_name || '');
        setMlTransformation(initialData.ml_feature_mapping.transformation || 'none');
        setMlIsRequired(initialData.ml_feature_mapping.is_required || false);
        setMlDefaultValue(initialData.ml_feature_mapping.default_value ?? 0);
        
        // Convert Map to object for editing
        if (initialData.ml_feature_mapping.value_mapping) {
          const mapping = {};
          if (initialData.ml_feature_mapping.value_mapping instanceof Map) {
            initialData.ml_feature_mapping.value_mapping.forEach((v, k) => {
              mapping[k] = v;
            });
          } else {
            Object.assign(mapping, initialData.ml_feature_mapping.value_mapping);
          }
          setMlValueMapping(mapping);
        }
      }
      
      // Load render config if exists
      if (initialData.render_config) {
        setRenderType(initialData.render_config.type || 'default');
      }
    } else {
      // Reset for new question
      setQuestionText('');
      setQuestionType('text');
      setOptions(['']);
      setMlFeatureName('');
      setMlTransformation('none');
      setMlIsRequired(false);
      setMlDefaultValue(0);
      setMlValueMapping({});
      setRenderType('default');
    }
  }, [initialData, open]);

  // Auto-create value mapping when options change
  useEffect(() => {
    if ((questionType === 'radio' || questionType === 'dropdown') && options.length > 0) {
      const selectedFeature = ML_FEATURES.find(f => f.value === mlFeatureName);
      
      if (selectedFeature && selectedFeature.type === 'binary') {
        // Auto-suggest binary mapping for Yes/No type questions
        const mapping = {};
        options.forEach(opt => {
          if (opt.trim()) {
            if (/yes|true|positive|often|always|frequently/i.test(opt)) {
              mapping[opt] = 1;
            } else if (/no|false|negative|never|rarely/i.test(opt)) {
              mapping[opt] = 0;
            } else {
              mapping[opt] = mlValueMapping[opt] ?? 0;
            }
          }
        });
        setMlValueMapping(mapping);
      }
    }
  }, [options, questionType, mlFeatureName]);

  const handleOptionChange = (idx, value) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (idx) => {
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleValueMappingChange = (option, value) => {
    setMlValueMapping(prev => ({
      ...prev,
      [option]: parseFloat(value)
    }));
  };

  const handleSubmit = () => {
    const data = {
      question_text: questionText,
      question_type: questionType,
      options: (questionType === 'radio' || questionType === 'dropdown' || questionType === 'checkbox') 
        ? options.filter(opt => opt.trim() !== '') 
        : [],
    };
    
    // Add ML feature mapping if configured
    if (mlFeatureName) {
      data.ml_feature_mapping = {
        feature_name: mlFeatureName,
        transformation: mlTransformation,
        is_required: mlIsRequired,
        default_value: mlDefaultValue,
      };
      
      // Add value mapping for radio/dropdown questions
      if ((questionType === 'radio' || questionType === 'dropdown') && Object.keys(mlValueMapping).length > 0) {
        data.ml_feature_mapping.value_mapping = mlValueMapping;
      }
    }
    
    // Add render config if special rendering is needed
    if (renderType === 'unit_conversion') {
      data.render_config = {
        type: 'unit_conversion',
        config: {
          from_units: [
            { name: 'feet', type: 'dropdown', options: unitFromFeet, label: 'Feet' },
            { name: 'inches', type: 'dropdown', options: unitFromInches, label: 'Inches' }
          ],
          to_unit: 'cm',
          formula: '(feet * 30.48) + (inches * 2.54)',
          display_format: '{feet} ft {inches} in'
        }
      };
    }
    
    onSubmit(data);
  };

  const selectedFeature = ML_FEATURES.find(f => f.value === mlFeatureName);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialData ? 'Edit Question' : 'Add Question'}</DialogTitle>
      <DialogContent>
        {/* Basic Question Configuration */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Basic Question Settings
          </Typography>
          
          <TextField
            label="Question Text"
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Question Type</InputLabel>
            <Select
              value={QUESTION_TYPES.map(t=>t.value).includes(questionType) ? questionType : QUESTION_TYPES[0].value}
              label="Question Type"
              onChange={e => setQuestionType(e.target.value)}
            >
              {QUESTION_TYPES.map(type => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {(questionType === 'radio' || questionType === 'dropdown' || questionType === 'checkbox') && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>Options</Typography>
              {options.map((opt, idx) => (
                <Box key={idx} display="flex" alignItems="center" mb={1}>
                  <TextField
                    value={opt}
                    onChange={e => handleOptionChange(idx, e.target.value)}
                    fullWidth
                    size="small"
                    placeholder={`Option ${idx + 1}`}
                    sx={{ mr: 1 }}
                  />
                  <IconButton onClick={() => handleRemoveOption(idx)} disabled={options.length === 1}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button startIcon={<AddIcon />} onClick={handleAddOption} size="small" sx={{ mt: 1 }}>
                Add Option
              </Button>
            </Box>
          )}
        </Paper>

        {/* ML Model Integration */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>
              🤖 ML Model Integration
              {mlFeatureName && <Chip label="Configured" size="small" color="success" sx={{ ml: 2 }} />}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
              Configure how this question's answer will be used by the diabetes risk assessment AI model.
            </Alert>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>ML Feature Name</InputLabel>
              <Select
                value={mlFeatureName}
                label="ML Feature Name"
                onChange={e => setMlFeatureName(e.target.value)}
              >
                {ML_FEATURES.map(feature => (
                  <MenuItem key={feature.value} value={feature.value}>
                    {feature.label}
                    {feature.calculated && <Chip label="Auto-calculated" size="small" sx={{ ml: 1 }} />}
                    {feature.forCalculation && <Chip label="For BMI calc" size="small" sx={{ ml: 1 }} />}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {mlFeatureName && (
              <>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Transformation</InputLabel>
                  <Select
                    value={mlTransformation}
                    label="Transformation"
                    onChange={e => setMlTransformation(e.target.value)}
                  >
                    {TRANSFORMATION_TYPES.map(type => (
                      <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={mlIsRequired}
                      onChange={e => setMlIsRequired(e.target.checked)}
                    />
                  }
                  label="Required for risk assessment"
                />
                
                <TextField
                  label="Default Value (if not answered)"
                  type="number"
                  value={mlDefaultValue}
                  onChange={e => setMlDefaultValue(parseFloat(e.target.value))}
                  fullWidth
                  margin="normal"
                  size="small"
                />
                
                {/* Value Mapping for Radio/Dropdown */}
                {(questionType === 'radio' || questionType === 'dropdown') && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Value Mapping (Option → ML Value)
                    </Typography>
                    <Alert severity="info" sx={{ mb: 1 }} icon={false}>
                      Map each answer option to a numeric value for the ML model.
                      {selectedFeature?.type === 'binary' && ' Binary features: use 1 for Yes, 0 for No.'}
                    </Alert>
                    {options.filter(o => o.trim()).map((option, idx) => (
                      <Box key={idx} display="flex" alignItems="center" gap={1} mb={1}>
                        <Chip label={option} sx={{ minWidth: 100 }} />
                        <Typography>→</Typography>
                        <TextField
                          type="number"
                          size="small"
                          value={mlValueMapping[option] ?? 0}
                          onChange={e => handleValueMappingChange(option, e.target.value)}
                          sx={{ width: 100 }}
                          inputProps={{ step: selectedFeature?.type === 'binary' ? 1 : 0.1 }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Special Rendering Config */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>
              🎨 Special Rendering
              {renderType !== 'default' && <Chip label="Custom" size="small" color="primary" sx={{ ml: 2 }} />}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
              Configure custom UI rendering (e.g., height in feet/inches instead of text field).
            </Alert>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Render Type</InputLabel>
              <Select
                value={renderType}
                label="Render Type"
                onChange={e => setRenderType(e.target.value)}
              >
                <MenuItem value="default">Default (standard input)</MenuItem>
                <MenuItem value="unit_conversion">Unit Conversion (e.g., feet/inches → cm)</MenuItem>
              </Select>
            </FormControl>
            
            {renderType === 'unit_conversion' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Unit conversion configured: User selects feet/inches, automatically converts to cm.
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!questionText.trim()}>
          {initialData ? 'Update Question' : 'Add Question'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 
