import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    Alert,
    CircularProgress,
    IconButton,
    Divider,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import axiosInstance from '../../utils/axiosInstance';

const MedicalInformationForm = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [formData, setFormData] = useState({
        diabetes_type: '',
        diagnosis_date: null,
        current_medications: [],
        allergies: [],
        chronic_conditions: [],
        family_history: [],
        recent_lab_results: {
            hba1c: { value: '', date: null, unit: '%' },
            fasting_glucose: { value: '', date: null, unit: 'mg/dL' },
            cholesterol: { total: '', ldl: '', hdl: '', date: null, unit: 'mg/dL' },
        },
        blood_pressure: {
            systolic: '',
            diastolic: '',
            last_recorded: null,
        },
        last_medical_checkup: null,
    });

    useEffect(() => {
        fetchMedicalInfo();
    }, []);

    const fetchMedicalInfo = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/personalized-system/medical-info');
            if (response.data.success) {
                const data = response.data.data;
                setFormData({
                    diabetes_type: data.diabetes_type || '',
                    diagnosis_date: data.diagnosis_date ? new Date(data.diagnosis_date) : null,
                    current_medications: data.current_medications || [],
                    allergies: data.allergies || [],
                    chronic_conditions: data.chronic_conditions || [],
                    family_history: data.family_history || [],
                    recent_lab_results: {
                        hba1c: {
                            value: data.recent_lab_results?.hba1c?.value || '',
                            date: data.recent_lab_results?.hba1c?.date ? new Date(data.recent_lab_results.hba1c.date) : null,
                            unit: data.recent_lab_results?.hba1c?.unit || '%',
                        },
                        fasting_glucose: {
                            value: data.recent_lab_results?.fasting_glucose?.value || '',
                            date: data.recent_lab_results?.fasting_glucose?.date ? new Date(data.recent_lab_results.fasting_glucose.date) : null,
                            unit: data.recent_lab_results?.fasting_glucose?.unit || 'mg/dL',
                        },
                        cholesterol: {
                            total: data.recent_lab_results?.cholesterol?.total || '',
                            ldl: data.recent_lab_results?.cholesterol?.ldl || '',
                            hdl: data.recent_lab_results?.cholesterol?.hdl || '',
                            date: data.recent_lab_results?.cholesterol?.date ? new Date(data.recent_lab_results.cholesterol.date) : null,
                            unit: data.recent_lab_results?.cholesterol?.unit || 'mg/dL',
                        },
                    },
                    blood_pressure: {
                        systolic: data.blood_pressure?.systolic || '',
                        diastolic: data.blood_pressure?.diastolic || '',
                        last_recorded: data.blood_pressure?.last_recorded ? new Date(data.blood_pressure.last_recorded) : null,
                    },
                    last_medical_checkup: data.last_medical_checkup ? new Date(data.last_medical_checkup) : null,
                });
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                setError('Failed to load medical information.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleNestedChange = (parent, field, value) => {
        setFormData((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value,
            },
        }));
    };

    const handleDeepNestedChange = (parent, child, field, value) => {
        setFormData((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [child]: {
                    ...prev[parent][child],
                    [field]: value,
                },
            },
        }));
    };

    // Array handlers
    const addMedication = () => {
        setFormData((prev) => ({
            ...prev,
            current_medications: [...prev.current_medications, { medication_name: '', dosage: '', frequency: '' }],
        }));
    };

    const removeMedication = (index) => {
        setFormData((prev) => ({
            ...prev,
            current_medications: prev.current_medications.filter((_, i) => i !== index),
        }));
    };

    const updateMedication = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            current_medications: prev.current_medications.map((med, i) =>
                i === index ? { ...med, [field]: value } : med
            ),
        }));
    };

    const addAllergy = () => {
        setFormData((prev) => ({
            ...prev,
            allergies: [...prev.allergies, { allergen: '', reaction: '' }],
        }));
    };

    const removeAllergy = (index) => {
        setFormData((prev) => ({
            ...prev,
            allergies: prev.allergies.filter((_, i) => i !== index),
        }));
    };

    const updateAllergy = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            allergies: prev.allergies.map((allergy, i) =>
                i === index ? { ...allergy, [field]: value } : allergy
            ),
        }));
    };

    const addChronicCondition = () => {
        setFormData((prev) => ({
            ...prev,
            chronic_conditions: [...prev.chronic_conditions, { condition_name: '', diagnosed_date: null }],
        }));
    };

    const removeChronicCondition = (index) => {
        setFormData((prev) => ({
            ...prev,
            chronic_conditions: prev.chronic_conditions.filter((_, i) => i !== index),
        }));
    };

    const updateChronicCondition = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            chronic_conditions: prev.chronic_conditions.map((condition, i) =>
                i === index ? { ...condition, [field]: value } : condition
            ),
        }));
    };

    const addFamilyHistory = () => {
        setFormData((prev) => ({
            ...prev,
            family_history: [...prev.family_history, { relation: '', condition: '' }],
        }));
    };

    const removeFamilyHistory = (index) => {
        setFormData((prev) => ({
            ...prev,
            family_history: prev.family_history.filter((_, i) => i !== index),
        }));
    };

    const updateFamilyHistory = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            family_history: prev.family_history.map((history, i) =>
                i === index ? { ...history, [field]: value } : history
            ),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.diabetes_type || !formData.diagnosis_date) {
            setError('Diabetes type and diagnosis date are required.');
            return;
        }

        setSaving(true);
        try {
            const response = await axiosInstance.post('/personalized-system/medical-info', formData);
            if (response.data.success) {
                setSuccess('Medical information saved successfully!');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save medical information.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
                Medical Information
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                Please provide your medical details for personalized health management.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    {/* Basic Diabetes Information */}
                    <Grid item xs={12} md={6}>
                        <TextField
                            select
                            fullWidth
                            required
                            label="Diabetes Type"
                            value={formData.diabetes_type}
                            onChange={(e) => handleChange('diabetes_type', e.target.value)}
                        >
                            <MenuItem value="Type 1">Type 1</MenuItem>
                            <MenuItem value="Type 2">Type 2</MenuItem>
                            <MenuItem value="Gestational">Gestational</MenuItem>
                            <MenuItem value="Prediabetes">Prediabetes</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Diagnosis Date *"
                                value={formData.diagnosis_date}
                                onChange={(date) => handleChange('diagnosis_date', date)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        required: true,
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>

                    {/* Current Medications */}
                    <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">Current Medications</Typography>
                            <Button onClick={addMedication} size="small">
                                Add Medication
                            </Button>
                        </Box>
                    </Grid>
                    {formData.current_medications.map((med, index) => (
                        <React.Fragment key={index}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Medication Name"
                                    value={med.medication_name}
                                    onChange={(e) => updateMedication(index, 'medication_name', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Dosage"
                                    value={med.dosage}
                                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Frequency"
                                    value={med.frequency}
                                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={1}>
                                <IconButton onClick={() => removeMedication(index)} color="error">
                                    Delete
                                </IconButton>
                            </Grid>
                        </React.Fragment>
                    ))}

                    {/* Allergies */}
                    <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">Allergies</Typography>
                            <Button onClick={addAllergy} size="small">
                                Add Allergy
                            </Button>
                        </Box>
                    </Grid>
                    {formData.allergies.map((allergy, index) => (
                        <React.Fragment key={index}>
                            <Grid item xs={12} md={5}>
                                <TextField
                                    fullWidth
                                    label="Allergen"
                                    value={allergy.allergen}
                                    onChange={(e) => updateAllergy(index, 'allergen', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Reaction"
                                    value={allergy.reaction}
                                    onChange={(e) => updateAllergy(index, 'reaction', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={1}>
                                <IconButton onClick={() => removeAllergy(index)} color="error">
                                    Delete
                                </IconButton>
                            </Grid>
                        </React.Fragment>
                    ))}

                    {/* Chronic Conditions */}
                    <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">Chronic Conditions</Typography>
                            <Button onClick={addChronicCondition} size="small">
                                Add Condition
                            </Button>
                        </Box>
                    </Grid>
                    {formData.chronic_conditions.map((condition, index) => (
                        <React.Fragment key={index}>
                            <Grid item xs={12} md={5}>
                                <TextField
                                    fullWidth
                                    label="Condition Name"
                                    value={condition.condition_name}
                                    onChange={(e) => updateChronicCondition(index, 'condition_name', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                        label="Diagnosed Date"
                                        value={condition.diagnosed_date}
                                        onChange={(date) => updateChronicCondition(index, 'diagnosed_date', date)}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                            },
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} md={1}>
                                <IconButton onClick={() => removeChronicCondition(index)} color="error">
                                    Delete
                                </IconButton>
                            </Grid>
                        </React.Fragment>
                    ))}

                    {/* Family History */}
                    <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">Family History</Typography>
                            <Button onClick={addFamilyHistory} size="small">
                                Add Family History
                            </Button>
                        </Box>
                    </Grid>
                    {formData.family_history.map((history, index) => (
                        <React.Fragment key={index}>
                            <Grid item xs={12} md={5}>
                                <TextField
                                    fullWidth
                                    label="Relation"
                                    value={history.relation}
                                    onChange={(e) => updateFamilyHistory(index, 'relation', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Condition"
                                    value={history.condition}
                                    onChange={(e) => updateFamilyHistory(index, 'condition', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={1}>
                                <IconButton onClick={() => removeFamilyHistory(index)} color="error">
                                    Delete
                                </IconButton>
                            </Grid>
                        </React.Fragment>
                    ))}

                    {/* Lab Results */}
                    <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6">Recent Lab Results</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="HbA1c Value (%)"
                            value={formData.recent_lab_results.hba1c.value}
                            onChange={(e) => handleDeepNestedChange('recent_lab_results', 'hba1c', 'value', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="HbA1c Test Date"
                                value={formData.recent_lab_results.hba1c.date}
                                onChange={(date) => handleDeepNestedChange('recent_lab_results', 'hba1c', 'date', date)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Fasting Glucose (mg/dL)"
                            value={formData.recent_lab_results.fasting_glucose.value}
                            onChange={(e) => handleDeepNestedChange('recent_lab_results', 'fasting_glucose', 'value', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Glucose Test Date"
                                value={formData.recent_lab_results.fasting_glucose.date}
                                onChange={(date) => handleDeepNestedChange('recent_lab_results', 'fasting_glucose', 'date', date)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Total Cholesterol (mg/dL)"
                            value={formData.recent_lab_results.cholesterol.total}
                            onChange={(e) => handleDeepNestedChange('recent_lab_results', 'cholesterol', 'total', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            type="number"
                            label="LDL (mg/dL)"
                            value={formData.recent_lab_results.cholesterol.ldl}
                            onChange={(e) => handleDeepNestedChange('recent_lab_results', 'cholesterol', 'ldl', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            type="number"
                            label="HDL (mg/dL)"
                            value={formData.recent_lab_results.cholesterol.hdl}
                            onChange={(e) => handleDeepNestedChange('recent_lab_results', 'cholesterol', 'hdl', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Cholesterol Test Date"
                                value={formData.recent_lab_results.cholesterol.date}
                                onChange={(date) => handleDeepNestedChange('recent_lab_results', 'cholesterol', 'date', date)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>

                    {/* Blood Pressure */}
                    <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6">Blood Pressure</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Systolic"
                            value={formData.blood_pressure.systolic}
                            onChange={(e) => handleNestedChange('blood_pressure', 'systolic', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Diastolic"
                            value={formData.blood_pressure.diastolic}
                            onChange={(e) => handleNestedChange('blood_pressure', 'diastolic', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Last Recorded"
                                value={formData.blood_pressure.last_recorded}
                                onChange={(date) => handleNestedChange('blood_pressure', 'last_recorded', date)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>

                    {/* Last Medical Checkup */}
                    <Grid item xs={12}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Last Medical Checkup"
                                value={formData.last_medical_checkup}
                                onChange={(date) => handleChange('last_medical_checkup', date)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>

                    {/* Submit Button */}
                    <Grid item xs={12}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            disabled={saving}
                            sx={{ mt: 2 }}
                        >
                            {saving ? 'Saving...' : 'Save Medical Information'}
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default MedicalInformationForm;
