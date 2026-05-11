import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Paper,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Button,
    TextField,
    MenuItem,
    Grid,
    FormControl,
    InputLabel,
    Select,
    LinearProgress,
    Card,
    Divider,
    Alert,
    Fade
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axiosInstance from '../utils/axiosInstance.js';
import { getCurrentUser } from '../utils/auth.js';
import { useNavigate, useLocation } from 'react-router-dom';

const PersonalizedSuggestionSystem = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const comingFromSummary = location.state?.from === 'summary';
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [userProfile, setUserProfile] = useState(null);

    // Form data state
    const [formData, setFormData] = useState({
        // Step 1 - Basic Info
        fullName: '',
        date_of_birth: null,
        gender: '',
        country: '',
        country_code: '',
        phone_number: '',
        
        // Step 2 - Lifestyle Info
        weight: '',
        height: '',
        heightFeet: '',
        heightInches: '',
        activity_level: '',
        sleep_hours: '',
        
        // Step 3 - Medical History
        diabetes_type: '',
        diagnosis_date: null,
        previous_diagnosis: '',
        duration_of_diabetes: '',
        medications: '',
        family_history: '',
        allergies: ''
    });

    // Load existing data on mount
    useEffect(() => {
        // Check if user is diagnosed before allowing access
        const checkDiagnosisStatus = async () => {
            try {
                const user = await getCurrentUser();
                setUserProfile(user);
                
                // If user is not diagnosed, redirect them
                if (user && user.diabetes_diagnosed !== 'yes') {
                    navigate('/dashboard', { 
                        state: { 
                            message: 'Please complete the diagnosis question to access personalized suggestions'
                        } 
                    });
                    return;
                }
                
                // Prefill form fields
                setFormData(prev => ({
                    ...prev,
                    fullName: user?.fullName || prev.fullName,
                    phone_number: user?.phone_number || prev.phone_number,
                }));
                
                // Load existing data
                loadExistingData();
            } catch (e) {
                // If not authenticated, redirect to login
                navigate('/signin', { 
                    state: { 
                        message: 'Please sign in to access personalized suggestions',
                        isDiagnosed: true
                    } 
                });
            }
        };
        
        checkDiagnosisStatus();
    }, [navigate]);

    const loadExistingData = async () => {
        try {
            // First get user data to pre-fill gender and DOB
            const user = await getCurrentUser();
            
            const [personalRes, medicalRes] = await Promise.all([
                axiosInstance.get('/personalized-system/personal-info'),
                axiosInstance.get('/personalized-system/medical-info')
            ]);

            if (personalRes.data.success && personalRes.data.data) {
                const personal = personalRes.data.data;
                // Convert height from cm to feet and inches if available
                let heightFeet = '';
                let heightInches = '';
                if (personal.height) {
                    const totalInches = personal.height / 2.54;
                    heightFeet = Math.floor(totalInches / 12);
                    heightInches = Math.round(totalInches % 12);
                }
                setFormData(prev => ({
                    ...prev,
                    fullName: personal.fullName || '',
                    // Use personal info if exists, otherwise fall back to user model
                    date_of_birth: personal.date_of_birth 
                        ? dayjs(personal.date_of_birth) 
                        : (user?.date_of_birth ? dayjs(user.date_of_birth) : null),
                    gender: personal.gender || user?.gender || '',
                    country: personal.country || '',
                    country_code: personal.country_code || '',
                    phone_number: personal.phone_number || '',
                    weight: personal.weight || '',
                    height: personal.height || '',
                    heightFeet: heightFeet,
                    heightInches: heightInches,
                    activity_level: personal.activity_level || '',
                    sleep_hours: personal.sleep_hours || ''
                }));
            } else {
                // If no personal info exists, use user model data
                setFormData(prev => ({
                    ...prev,
                    date_of_birth: user?.date_of_birth ? dayjs(user.date_of_birth) : null,
                    gender: user?.gender || '',
                }));
            }

            if (medicalRes.data.success && medicalRes.data.data) {
                const medical = medicalRes.data.data;
                setFormData(prev => ({
                    ...prev,
                    diabetes_type: medical.diabetes_type || '',
                    diagnosis_date: medical.diagnosis_date ? dayjs(medical.diagnosis_date) : null,
                    previous_diagnosis: medical.previous_diagnosis || '',
                    duration_of_diabetes: medical.duration_of_diabetes || '',
                    medications: medical.medications || '',
                    family_history: medical.family_history || '',
                    allergies: medical.allergies || ''
                }));
            }
        } catch (error) {
            console.error('Error loading data:', error);
            // Still try to get user data even if personal info fetch fails
            try {
                const user = await getCurrentUser();
                setFormData(prev => ({
                    ...prev,
                    date_of_birth: user?.date_of_birth ? dayjs(user.date_of_birth) : null,
                    gender: user?.gender || '',
                }));
            } catch (err) {
                console.error('Error loading user data:', err);
            }
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = async () => {
        if (activeStep < 3) {
            setActiveStep(prev => prev + 1);
        } else {
            await handleSave();
        }
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const handleSave = async () => {
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            // Save personal info
            const personalData = {
                date_of_birth: formData.date_of_birth ? formData.date_of_birth.format('YYYY-MM-DD') : null,
                gender: formData.gender,
                country: formData.country,
                country_code: formData.country_code,
                phone_number: formData.phone_number,
                weight: parseFloat(formData.weight) || null,
                height: parseFloat(formData.height) || null,
                activity_level: formData.activity_level,
                sleep_hours: parseFloat(formData.sleep_hours) || null
            };

            // Save medical info
            const medicalData = {
                diabetes_type: formData.diabetes_type,
                diagnosis_date: formData.diagnosis_date ? formData.diagnosis_date.format('YYYY-MM-DD') : null,
            };

            await Promise.all([
                axiosInstance.post('/personalized-system/personal-info', personalData),
                axiosInstance.post('/personalized-system/medical-info', medicalData)
            ]);

            setSuccessMessage('Your information has been saved successfully! 🎉');
            setTimeout(() => {
                if (comingFromSummary) {
                    navigate('/personalized-suggestions/personal-medical', { replace: true });
                } else {
                    setActiveStep(0);
                }
            }, 2000);

        } catch (error) {
            console.error('Error saving data:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to save information. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getProgress = () => {
        return ((activeStep + 1) / 4) * 100;
    };

    const steps = [
        { label: 'Basic Info', description: 'Tell us about yourself' },
        { label: 'Lifestyle Info', description: 'Your daily habits' },
        { label: 'Medical History', description: 'Health background' },
        { label: 'Review & Save', description: 'Confirm your details' }
    ];

    // Step content components
    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6} sx={{ display: 'flex', minWidth: 0 }}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                required
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                variant="outlined"
                                placeholder="Enter your full name"
                                disabled={!!userProfile?.fullName}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ display: 'flex', minWidth: 0 }}>
                            <Box sx={{ width: '100% !important' }}>
                                <Autocomplete
                                    fullWidth
                                    options={["Male", "Female", "Other"]}
                                    value={formData.gender || null}
                                    onChange={(e, newValue) => handleInputChange('gender', newValue || '')}
                                    disableClearable
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            label="Gender"
                                            placeholder="Select your gender"
                                            sx={{ width: '100% !important' }}
                                        />
                                    )}
                                    sx={{ width: '100% !important', flex: '1 1 auto', minWidth: 0 }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ display: 'flex', minWidth: 0 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Date of Birth"
                                    value={formData.date_of_birth}
                                    onChange={(newValue) => handleInputChange('date_of_birth', newValue)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
                                            variant: "outlined"
                                        }
                                    }}
                                    maxDate={dayjs()}
                                    sx={{ width: '100%', flex: 1 }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ display: 'flex', minWidth: 0 }}>
                            <TextField
                                select
                                fullWidth
                                required
                                label="Country / Region"
                                value={formData.country}
                                onChange={(e) => {
                                    const selectedCountry = e.target.value;
                                    const countryCodes = {
                                        'Pakistan': '+92',
                                        'India': '+91',
                                        'United States': '+1',
                                        'United Kingdom': '+44',
                                        'UAE': '+971',
                                        'Saudi Arabia': '+966',
                                        'Bangladesh': '+880',
                                        'Canada': '+1',
                                        'Australia': '+61',
                                        'Other': ''
                                    };
                                    handleInputChange('country', selectedCountry);
                                    handleInputChange('country_code', countryCodes[selectedCountry] || '');
                                }}
                                variant="outlined"
                            >
                                <MenuItem value="Pakistan">🇵🇰 Pakistan</MenuItem>
                                <MenuItem value="India">🇮🇳 India</MenuItem>
                                <MenuItem value="United States">🇺🇸 United States</MenuItem>
                                <MenuItem value="United Kingdom">🇬🇧 United Kingdom</MenuItem>
                                <MenuItem value="UAE">🇦🇪 UAE</MenuItem>
                                <MenuItem value="Saudi Arabia">🇸🇦 Saudi Arabia</MenuItem>
                                <MenuItem value="Bangladesh">🇧🇩 Bangladesh</MenuItem>
                                <MenuItem value="Canada">🇨🇦 Canada</MenuItem>
                                <MenuItem value="Australia">🇦🇺 Australia</MenuItem>
                                <MenuItem value="Other">🌍 Other</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ display: 'flex', minWidth: 0 }}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                required
                                value={formData.phone_number}
                                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                variant="outlined"
                                placeholder={formData.country_code ? `${formData.country_code} XXXXXXXXXX` : "Enter phone number"}
                                disabled={!!userProfile?.phone_number}
                                helperText={formData.country_code ? `Format: ${formData.country_code} followed by your number` : 'Select country first'}
                            />
                        </Grid>
                    </Grid>
                );

            case 1:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6} sx={{ display: 'flex', minWidth: 0 }}>
                            <TextField
                                fullWidth
                                label="Weight (kg)"
                                type="number"
                                required
                                value={formData.weight}
                                onChange={(e) => handleInputChange('weight', e.target.value)}
                                variant="outlined"
                                placeholder="e.g., 70"
                            />
                        </Grid>
                        <Grid item xs={12} md={3} sx={{ display: 'flex', minWidth: 0 }}>
                            <TextField
                                select
                                fullWidth
                                label="Height (ft)"
                                required
                                value={formData.heightFeet}
                                onChange={(e) => {
                                    handleInputChange('heightFeet', e.target.value);
                                    const feet = parseFloat(e.target.value) || 0;
                                    const inches = parseFloat(formData.heightInches) || 0;
                                    const totalCm = Math.round((feet * 30.48) + (inches * 2.54));
                                    handleInputChange('height', totalCm);
                                }}
                                variant="outlined"
                            >
                                {[3, 4, 5, 6, 7, 8].map(ft => (
                                    <MenuItem key={ft} value={ft}>{ft} ft</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3} sx={{ display: 'flex', minWidth: 0 }}>
                            <TextField
                                select
                                fullWidth
                                label="Height (in)"
                                required
                                value={formData.heightInches}
                                onChange={(e) => {
                                    handleInputChange('heightInches', e.target.value);
                                    const feet = parseFloat(formData.heightFeet) || 0;
                                    const inches = parseFloat(e.target.value) || 0;
                                    const totalCm = Math.round((feet * 30.48) + (inches * 2.54));
                                    handleInputChange('height', totalCm);
                                }}
                                variant="outlined"
                            >
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(inch => (
                                    <MenuItem key={inch} value={inch}>{inch} in</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ display: 'flex', minWidth: 0 }}>
                            <Autocomplete
                                fullWidth
                                options={[
                                    'Sedentary',
                                    'Lightly Active',
                                    'Moderately Active',
                                    'Very Active',
                                    'Extremely Active',
                                ]}
                                value={formData.activity_level || null}
                                onChange={(e, newValue) => handleInputChange('activity_level', newValue || '')}
                                disableClearable
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        label="Activity Level"
                                        placeholder="Select activity level"
                                    />
                                )}
                                sx={{ width: '100%', flex: 1, minWidth: 0 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ display: 'flex', minWidth: 0 }}>
                            <TextField
                                fullWidth
                                label="Sleep Hours (per night)"
                                type="number"
                                required
                                value={formData.sleep_hours}
                                onChange={(e) => handleInputChange('sleep_hours', e.target.value)}
                                variant="outlined"
                                placeholder="e.g., 7"
                                inputProps={{ min: 0, max: 24, step: 0.5 }}
                            />
                        </Grid>
                    </Grid>
                );

            case 2:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6} sx={{ display: 'flex', minWidth: 0 }}>
                            <Autocomplete
                                fullWidth
                                options={["Type 1", "Type 2", "Gestational", "Prediabetes", "Other"]}
                                value={formData.diabetes_type || null}
                                onChange={(e, newValue) => handleInputChange('diabetes_type', newValue || '')}
                                renderInput={(params) => (
                                    <TextField {...params} label="Diabetes Type" placeholder="Select type" />
                                )}
                                sx={{ width: '100%', flex: 1, minWidth: 0 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ display: 'flex', minWidth: 0 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Diagnosis Date"
                                    value={formData.diagnosis_date}
                                    onChange={(newVal) => handleInputChange('diagnosis_date', newVal)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            variant: 'outlined'
                                        }
                                    }}
                                    maxDate={dayjs()}
                                    sx={{ width: '100%', flex: 1 }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Previous Diagnosis"
                                multiline
                                rows={3}
                                value={formData.previous_diagnosis}
                                onChange={(e) => handleInputChange('previous_diagnosis', e.target.value)}
                                variant="outlined"
                                placeholder="List any previous health conditions"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Duration of Diabetes"
                                value={formData.duration_of_diabetes}
                                onChange={(e) => handleInputChange('duration_of_diabetes', e.target.value)}
                                variant="outlined"
                                placeholder="e.g., 2 years"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Current Medications"
                                multiline
                                rows={3}
                                value={formData.medications}
                                onChange={(e) => handleInputChange('medications', e.target.value)}
                                variant="outlined"
                                placeholder="List medications you're taking"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Family History"
                                multiline
                                rows={3}
                                value={formData.family_history}
                                onChange={(e) => handleInputChange('family_history', e.target.value)}
                                variant="outlined"
                                placeholder="Family health history (diabetes, heart disease, etc.)"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Allergies"
                                value={formData.allergies}
                                onChange={(e) => handleInputChange('allergies', e.target.value)}
                                variant="outlined"
                                placeholder="List any allergies (food, medicine, etc.)"
                            />
                        </Grid>
                    </Grid>
                );

            case 3:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
                            Review Your Information
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Please review your information before saving. You can always edit it later.
                        </Typography>

                        <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                Basic Information
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Full Name:</Typography>
                                    <Typography variant="body1">{formData.fullName || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Date of Birth:</Typography>
                                    <Typography variant="body1">
                                        {formData.date_of_birth ? formData.date_of_birth.format('MMM DD, YYYY') : 'Not provided'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Gender:</Typography>
                                    <Typography variant="body1">{formData.gender || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Country:</Typography>
                                    <Typography variant="body1">{formData.country || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Phone:</Typography>
                                    <Typography variant="body1">{formData.country_code && formData.phone_number ? `${formData.country_code} ${formData.phone_number}` : formData.phone_number || 'Not provided'}</Typography>
                                </Grid>
                            </Grid>
                        </Card>

                        <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                Lifestyle Information
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Weight:</Typography>
                                    <Typography variant="body1">{formData.weight ? `${formData.weight} kg` : 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Height:</Typography>
                                    <Typography variant="body1">{formData.height ? `${formData.height} cm` : 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Activity Level:</Typography>
                                    <Typography variant="body1">{formData.activity_level || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Sleep Hours:</Typography>
                                    <Typography variant="body1">{formData.sleep_hours ? `${formData.sleep_hours} hrs` : 'Not provided'}</Typography>
                                </Grid>
                            </Grid>
                        </Card>

                        <Card variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                Medical History
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Diabetes Type:</Typography>
                                    <Typography variant="body1">{formData.diabetes_type || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Diagnosis Date:</Typography>
                                    <Typography variant="body1">{formData.diagnosis_date ? formData.diagnosis_date.format('MMM DD, YYYY') : 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">Previous Diagnosis:</Typography>
                                    <Typography variant="body1">{formData.previous_diagnosis || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">Duration of Diabetes:</Typography>
                                    <Typography variant="body1">{formData.duration_of_diabetes || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">Medications:</Typography>
                                    <Typography variant="body1">{formData.medications || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">Family History:</Typography>
                                    <Typography variant="body1">{formData.family_history || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">Allergies:</Typography>
                                    <Typography variant="body1">{formData.allergies || 'Not provided'}</Typography>
                                </Grid>
                            </Grid>
                        </Card>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', py: 4 }}>
            <Container maxWidth="md">
                {/* Header Section */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
                        Personal & Medical Information
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Complete your profile to receive personalized health recommendations
                    </Typography>
                </Box>

                {/* Main Card */}
                <Card elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    {/* Progress Bar */}
                    <LinearProgress 
                        variant="determinate" 
                        value={getProgress()} 
                        sx={{ height: 6 }}
                    />

                    <Box sx={{ p: 4 }}>
                        {/* Stepper */}
                        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                            {steps.map((step) => (
                                <Step key={step.label}>
                                    <StepLabel>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            {step.label}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {step.description}
                                        </Typography>
                                    </StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        <Divider sx={{ mb: 4 }} />

                        {/* Success/Error Messages */}
                        {successMessage && (
                            <Fade in={!!successMessage}>
                                <Alert severity="success" sx={{ mb: 3 }}>
                                    {successMessage}
                                </Alert>
                            </Fade>
                        )}
                        {errorMessage && (
                            <Fade in={!!errorMessage}>
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {errorMessage}
                                </Alert>
                            </Fade>
                        )}

                        {/* Step Content */}
                        <Box sx={{
                            minHeight: 300,
                            mb: 4,
                            '& .MuiFormControl-root': { width: '100%' },
                            '& .MuiInputBase-root': { width: '100%' },
                            '& .MuiOutlinedInput-root': { width: '100%' },
                            '& .MuiSelect-select': { width: '100%', display: 'block' },
                            '& .MuiAutocomplete-root': { width: '100%' }
                        }}>
                            {renderStepContent()}
                        </Box>

                        {/* Navigation Buttons */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: '1px solid #e0e0e0' }}>
                            <Button
                                variant="outlined"
                                onClick={handleBack}
                                disabled={activeStep === 0 || loading}
                                size="large"
                            >
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                disabled={loading}
                                size="large"
                            >
                                {loading ? 'Saving...' : activeStep === 3 ? 'Save & Complete' : 'Next'}
                            </Button>
                        </Box>
                    </Box>
                </Card>

                {/* Helper Text */}
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
                    Your information is secure and will only be used to personalize your health recommendations
                </Typography>
            </Container>
        </Box>
    );
};

export default PersonalizedSuggestionSystem;
