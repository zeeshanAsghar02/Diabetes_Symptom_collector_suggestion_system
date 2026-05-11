import React, { useState, useEffect } from 'react';
import { useDateFormat } from '../hooks/useDateFormat';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    LinearProgress,
    Divider,
    Paper,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Alert,
    Fade,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
    Edit as EditIcon,
    ArrowBack as ArrowBackIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance.js';
import dayjs from 'dayjs';
import { getCurrentUser } from '../utils/auth.js';

const PersonalMedicalInfoPage = ({ inModal = false, onDataSaved }) => {
    const { formatDate } = useDateFormat();
    const navigate = useNavigate();
    const [personalInfo, setPersonalInfo] = useState(null);
    const [medicalInfo, setMedicalInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [personalCompletion, setPersonalCompletion] = useState(0);
    const [medicalCompletion, setMedicalCompletion] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [savingData, setSavingData] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [fetchError, setFetchError] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        date_of_birth: null,
        gender: '',
        country: '',
        country_code: '',
        phone_number: '',
        weight: '',
        height: '',
        heightFeet: '',
        heightInches: '',
        activity_level: '',
        sleep_hours: '',
        diabetes_type: '',
        diagnosis_date: null,
        previous_diagnosis: '',
        duration_of_diabetes: '',
        medications: '',
        family_history: '',
        allergies: ''
    });

    useEffect(() => {
        fetchData();
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            const user = await getCurrentUser();
            setUserProfile(user);
        } catch (e) {
            console.error('Error loading user profile:', e);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setFetchError(''); // Clear any previous errors
            const [personalRes, medicalRes] = await Promise.all([
                axiosInstance.get('/personalized-system/personal-info'),
                axiosInstance.get('/personalized-system/medical-info'),
            ]);

            if (personalRes.data.success) {
                const personal = personalRes.data.data;
                setPersonalInfo(personal);
                calculateCompletion('personal', personal);
                
                // Convert height from cm to feet and inches if available
                let heightFeet = '';
                let heightInches = '';
                if (personal.height) {
                    const totalInches = personal.height / 2.54;
                    heightFeet = Math.floor(totalInches / 12);
                    heightInches = Math.round(totalInches % 12);
                }
                
                // Populate form data
                setFormData(prev => ({
                    ...prev,
                    fullName: personal.fullName || '',
                    date_of_birth: personal.date_of_birth ? dayjs(personal.date_of_birth) : null,
                    gender: personal.gender || '',
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
            }
            if (medicalRes.data.success) {
                const medical = medicalRes.data.data;
                setMedicalInfo(medical);
                calculateCompletion('medical', medical);
                
                // Populate form data
                setFormData(prev => ({
                    ...prev,
                    diabetes_type: medical.diabetes_type || '',
                    diagnosis_date: medical.diagnosis_date ? dayjs(medical.diagnosis_date) : null,
                    previous_diagnosis: medical.previous_diagnosis || '',
                    duration_of_diabetes: medical.duration_of_diabetes || '',
                    medications: medical.current_medications || '',
                    family_history: medical.family_history || '',
                    allergies: medical.allergies || ''
                }));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setFetchError('Failed to load your information. Please try again or contact support.');
        } finally {
            setLoading(false);
        }
    };

    const calculateCompletion = (type, data) => {
        if (type === 'personal') {
            const fields = ['fullName', 'date_of_birth', 'gender', 'phone_number', 'weight', 'height', 'activity_level', 'sleep_hours'];
            const filledFields = fields.filter(field => data && data[field]);
            const percentage = Math.round((filledFields.length / fields.length) * 100);
            setPersonalCompletion(percentage);
        } else if (type === 'medical') {
            const fields = ['diabetes_type', 'diagnosis_date', 'current_medications', 'allergies', 'chronic_conditions', 'family_history'];
            const filledFields = fields.filter(field => data && data[field]);
            const percentage = Math.round((filledFields.length / fields.length) * 100);
            setMedicalCompletion(percentage);
        }
    };

    const handleEditClick = () => {
        setEditMode(true);
        setActiveStep(0);
    };

    const handleCloseEdit = () => {
        setEditMode(false);
        setSuccessMessage('');
        setErrorMessage('');
        setFetchError('');
        fetchData(); // Refresh data
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

    const handleBackStep = () => {
        setActiveStep(prev => prev - 1);
    };

    const handleSave = async () => {
        setSavingData(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
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

            const medicalData = {
                diabetes_type: formData.diabetes_type,
                current_medications: Array.isArray(formData.medications) && formData.medications.length > 0 ? formData.medications : [],
                allergies: Array.isArray(formData.allergies) && formData.allergies.length > 0 ? formData.allergies : [],
                family_history: Array.isArray(formData.family_history) && formData.family_history.length > 0 ? formData.family_history : [],
                diagnosis_date: formData.diagnosis_date ? formData.diagnosis_date.format('YYYY-MM-DD') : null,
            };

            console.log('💾 Saving personal data:', personalData);
            console.log('💾 Saving medical data:', medicalData);

            const [personalResponse, medicalResponse] = await Promise.all([
                axiosInstance.post('/personalized-system/personal-info', personalData),
                axiosInstance.post('/personalized-system/medical-info', medicalData)
            ]);

            console.log('✅ Personal info saved:', personalResponse.data);
            console.log('✅ Medical info saved:', medicalResponse.data);

            setSuccessMessage('Your information has been saved successfully! 🎉');
            await fetchData(); // Refresh data
            
            // Notify parent component that data was saved
            if (onDataSaved && typeof onDataSaved === 'function') {
                onDataSaved();
            }
            
            setTimeout(() => {
                handleCloseEdit();
            }, 1500);

        } catch (error) {
            console.error('❌ Error saving data:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error message:', error.message);
            
            const errorMsg = error.response?.data?.message 
                || error.message 
                || 'Failed to save information. Please try again.';
            
            setErrorMessage(errorMsg);
            
            // Keep the dialog open so user can see the error
        } finally {
            setSavingData(false);
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

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
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
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                fullWidth
                                options={["Male", "Female", "Other"]}
                                value={formData.gender || null}
                                onChange={(e, newValue) => handleInputChange('gender', newValue || '')}
                                disableClearable
                                renderInput={(params) => (
                                    <TextField {...params} fullWidth label="Gender" placeholder="Select your gender" />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Date of Birth"
                                    value={formData.date_of_birth}
                                    onChange={(newValue) => handleInputChange('date_of_birth', newValue)}
                                    slotProps={{ textField: { fullWidth: true, required: true, variant: "outlined" } }}
                                    maxDate={dayjs()}
                                    sx={{ width: '100%' }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                select
                                fullWidth
                                required
                                label="Country / Region"
                                value={formData.country}
                                onChange={(e) => {
                                    const selectedCountry = e.target.value;
                                    const countryCodes = {
                                        'Pakistan': '+92', 'India': '+91', 'United States': '+1',
                                        'United Kingdom': '+44', 'UAE': '+971', 'Saudi Arabia': '+966',
                                        'Bangladesh': '+880', 'Canada': '+1', 'Australia': '+61', 'Other': ''
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
                        <Grid item xs={12} md={6}>
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
                        <Grid item xs={12} md={6}>
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
                        <Grid item xs={12} md={3}>
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
                        <Grid item xs={12} md={3}>
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
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                fullWidth
                                options={['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active']}
                                value={formData.activity_level || null}
                                onChange={(e, newValue) => handleInputChange('activity_level', newValue || '')}
                                disableClearable
                                renderInput={(params) => (
                                    <TextField {...params} fullWidth label="Activity Level" placeholder="Select activity level" />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
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
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                fullWidth
                                options={["Type 1", "Type 2", "Gestational", "Prediabetes", "Other"]}
                                value={formData.diabetes_type || null}
                                onChange={(e, newValue) => handleInputChange('diabetes_type', newValue || '')}
                                renderInput={(params) => (
                                    <TextField {...params} label="Diabetes Type" placeholder="Select type" />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Diagnosis Date"
                                    value={formData.diagnosis_date}
                                    onChange={(newVal) => handleInputChange('diagnosis_date', newVal)}
                                    slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                                    maxDate={dayjs()}
                                    sx={{ width: '100%' }}
                                />
                            </LocalizationProvider>
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
                                placeholder="Family health history"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Allergies"
                                value={formData.allergies}
                                onChange={(e) => handleInputChange('allergies', e.target.value)}
                                variant="outlined"
                                placeholder="List any allergies"
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
                            Please review your information before saving.
                        </Typography>

                        <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Basic Information</Typography>
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
                                    <Typography variant="body2" color="text.secondary">Phone:</Typography>
                                    <Typography variant="body1">
                                        {formData.country_code && formData.phone_number ? `${formData.country_code} ${formData.phone_number}` : formData.phone_number || 'Not provided'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Card>

                        <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Lifestyle Information</Typography>
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
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Medical History</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Diabetes Type:</Typography>
                                    <Typography variant="body1">{formData.diabetes_type || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Diagnosis Date:</Typography>
                                    <Typography variant="body1">
                                        {formData.diagnosis_date ? formData.diagnosis_date.format('MMM DD, YYYY') : 'Not provided'}
                                    </Typography>
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

    const handleBack = () => {
        navigate('/personalized-suggestions/dashboard', { replace: true });
    };

    const renderField = (label, value, isEmpty = false) => (
        <Box 
            sx={{ 
                p: 2.5,
                borderRadius: 2,
                bgcolor: isEmpty ? '#f9fafb' : '#ffffff',
                border: '1px solid',
                borderColor: isEmpty ? '#e5e7eb' : '#e2e8f0',
                transition: 'all 0.2s ease',
                '&:hover': {
                    borderColor: isEmpty ? '#d1d5db' : '#cbd5e1',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }
            }}
        >
            <Typography 
                variant="caption" 
                sx={{ 
                    fontWeight: 700, 
                    textTransform: 'uppercase',
                    color: '#64748b',
                    letterSpacing: 0.5,
                    fontSize: '0.7rem'
                }}
            >
                {label}
            </Typography>
            <Typography
                variant="body1"
                sx={{
                    mt: 1,
                    color: isEmpty ? '#9ca3af' : '#1e293b',
                    fontStyle: isEmpty ? 'italic' : 'normal',
                    fontWeight: isEmpty ? 400 : 600,
                    fontSize: '0.95rem'
                }}
            >
                {isEmpty ? 'Not provided' : value}
            </Typography>
        </Box>
    );

    if (loading) {
        return (
            <Box sx={{ minHeight: inModal ? '60vh' : '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Show error message if data fetch failed
    if (fetchError) {
        return (
            <Box sx={{ minHeight: inModal ? '60vh' : '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: inModal ? 'transparent' : '#f5f7fa' }}>
                <Container maxWidth="md">
                    <Card elevation={2} sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
                        <WarningIcon sx={{ fontSize: 64, color: '#dc2626', mb: 2 }} />
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            {fetchError}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Please try to refresh the page or go back to the dashboard.
                        </Typography>
                        {!inModal && (
                            <Button
                                variant="contained"
                                onClick={() => navigate('/personalized-suggestions/dashboard', { replace: true })}
                                sx={{ mt: 2 }}
                            >
                                Go to Dashboard
                            </Button>
                        )}
                    </Card>
                </Container>
            </Box>
        );
    }

    // Show message if no data is available
    if (!personalInfo && !medicalInfo && !inModal) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f7fa' }}>
                <Container maxWidth="md">
                    <Card elevation={2} sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            No Information Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Please fill out your personal and medical information first.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/personalized-suggestions', { replace: true })}
                            sx={{ mt: 2 }}
                        >
                            Fill Information
                        </Button>
                    </Card>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: inModal ? 'auto' : '100vh', bgcolor: inModal ? 'transparent' : '#f5f7fa', py: inModal ? 2 : 4 }}>
            <Container maxWidth="md">
                {/* Header - Only show when not in modal */}
                {!inModal && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={handleBack}
                            sx={{ mr: 2, textTransform: 'none' }}
                        >
                            Back
                        </Button>
                        <Box>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main' }}>
                                Personal & Medical Information
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                View and manage your health profile
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* Personal Information Card */}
                <Card elevation={0} sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            p: 3,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Box>
                            <Typography variant="h5" fontWeight={700} sx={{ color: '#ffffff', mb: 0.5 }}>
                                Personal Information
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                                Basic profile details
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box 
                                sx={{ 
                                    textAlign: 'right',
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    backdropFilter: 'blur(10px)',
                                    px: 2.5,
                                    py: 1,
                                    borderRadius: 2
                                }}
                            >
                                <Typography variant="h5" fontWeight={700} sx={{ color: '#ffffff' }}>
                                    {personalCompletion}%
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                                    Complete
                                </Typography>
                            </Box>
                            {personalCompletion === 100 && (
                                <CheckCircleIcon sx={{ color: '#10b981', fontSize: 36, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                            )}
                        </Box>
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ px: 4, pt: 3, pb: 1 }}>
                        <LinearProgress
                            variant="determinate"
                            value={personalCompletion}
                            sx={{
                                height: 10,
                                borderRadius: 5,
                                bgcolor: '#e5e7eb',
                                '& .MuiLinearProgress-bar': {
                                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: 5,
                                },
                            }}
                        />
                    </Box>

                    <CardContent sx={{ p: 4 }}>
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} sm={6}>
                                {renderField('Full Name', personalInfo?.fullName, !personalInfo?.fullName)}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderField('Gender', personalInfo?.gender, !personalInfo?.gender)}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderField(
                                    'Date of Birth',
                                    personalInfo?.date_of_birth
                                        ? formatDate(personalInfo.date_of_birth)
                                        : 'Not provided',
                                    !personalInfo?.date_of_birth
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderField('Phone Number', personalInfo?.phone_number, !personalInfo?.phone_number)}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderField('Weight (kg)', personalInfo?.weight, !personalInfo?.weight)}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderField('Height (cm)', personalInfo?.height, !personalInfo?.height)}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderField('Activity Level', personalInfo?.activity_level, !personalInfo?.activity_level)}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderField('Sleep Hours', personalInfo?.sleep_hours, !personalInfo?.sleep_hours)}
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Medical Information Card */}
                <Card elevation={0} sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            p: 3,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Box>
                            <Typography variant="h5" fontWeight={700} sx={{ color: '#ffffff', mb: 0.5 }}>
                                Medical Information
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                                Health history and current status
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box 
                                sx={{ 
                                    textAlign: 'right',
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    backdropFilter: 'blur(10px)',
                                    px: 2.5,
                                    py: 1,
                                    borderRadius: 2
                                }}
                            >
                                <Typography variant="h5" fontWeight={700} sx={{ color: '#ffffff' }}>
                                    {medicalCompletion}%
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                                    Complete
                                </Typography>
                            </Box>
                            {medicalCompletion === 100 && (
                                <CheckCircleIcon sx={{ color: '#ffffff', fontSize: 36, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                            )}
                        </Box>
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ px: 4, pt: 3, pb: 1 }}>
                        <LinearProgress
                            variant="determinate"
                            value={medicalCompletion}
                            sx={{
                                height: 10,
                                borderRadius: 5,
                                bgcolor: '#e5e7eb',
                                '& .MuiLinearProgress-bar': {
                                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                                    borderRadius: 5,
                                },
                            }}
                        />
                    </Box>

                    <CardContent sx={{ p: 4 }}>
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} sm={6}>
                                {renderField('Diabetes Type', medicalInfo?.diabetes_type, !medicalInfo?.diabetes_type)}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderField(
                                    'Diagnosis Date',
                                    medicalInfo?.diagnosis_date
                                        ? formatDate(medicalInfo.diagnosis_date)
                                        : 'Not provided',
                                    !medicalInfo?.diagnosis_date
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderField(
                                    'Previous Diagnosis',
                                    medicalInfo?.previous_diagnosis,
                                    !medicalInfo?.previous_diagnosis
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderField(
                                    'Current Medications',
                                    medicalInfo?.medications,
                                    !medicalInfo?.medications
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderField(
                                    'Allergies',
                                    medicalInfo?.allergies,
                                    !medicalInfo?.allergies
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderField(
                                    'Family History',
                                    medicalInfo?.family_history,
                                    !medicalInfo?.family_history
                                )}
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Edit Button */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
                    <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={handleEditClick}
                        sx={{
                            textTransform: 'none',
                            fontSize: '1rem',
                            px: 5,
                            py: 1.5,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                            fontWeight: 600,
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                                boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                                transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Edit Information
                    </Button>
                </Box>
            </Container>

            {/* Edit Dialog */}
            <Dialog 
                open={editMode} 
                onClose={handleCloseEdit}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        maxHeight: '90vh'
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" color="primary">
                            Edit Personal & Medical Information
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Update your profile information
                        </Typography>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ pt: 2 }}>
                    {/* Progress Bar */}
                    <LinearProgress 
                        variant="determinate" 
                        value={getProgress()} 
                        sx={{ height: 6, borderRadius: 3, mb: 3 }}
                    />

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
                    <Box sx={{ minHeight: 300 }}>
                        {renderStepContent()}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 2 }}>
                    <Button 
                        onClick={handleCloseEdit}
                        disabled={savingData}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    {activeStep > 0 && (
                        <Button 
                            onClick={handleBackStep}
                            disabled={savingData}
                            sx={{ textTransform: 'none' }}
                        >
                            Back
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={savingData}
                        sx={{ 
                            textTransform: 'none',
                            px: 3
                        }}
                    >
                        {savingData ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : activeStep === steps.length - 1 ? (
                            'Save Changes'
                        ) : (
                            'Next'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PersonalMedicalInfoPage;
