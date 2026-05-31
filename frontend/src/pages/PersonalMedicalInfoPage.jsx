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
    InputAdornment,
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
    const [formErrors, setFormErrors] = useState({});
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
        setFormErrors({});
        setFetchError('');
        fetchData(); // Refresh data
    };

    const handleInputChange = (field, value) => {
        if (['date_of_birth', 'diagnosis_date'].includes(field) && value && dayjs(value).isAfter(dayjs(), 'day')) {
            setFormErrors(prev => ({ ...prev, [field]: 'Please select a valid past date.' }));
            return;
        }
        setFormErrors(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const getLiveFieldError = (field) => {
        if (formErrors[field]) return formErrors[field];
        if (field === 'phone_number' && formData.phone_number && !String(formData.phone_number).trim().startsWith('+')) {
            return 'invalid number';
        }
        return '';
    };

    const validateStep = () => {
        const requiredByStep = {
            0: [
                ['fullName', 'Full name is required'],
                ['gender', 'Gender is required'],
                ['date_of_birth', 'Please select a valid past date.'],
                ['country', 'Country / region is required'],
                ['phone_number', 'Phone number is required'],
            ],
            1: [
                ['weight', 'Weight is required'],
                ['heightFeet', 'Height feet is required'],
                ['heightInches', 'Height inches is required'],
                ['activity_level', 'Activity level is required'],
                ['sleep_hours', 'Sleep hours are required'],
            ],
            2: [
                ['diabetes_type', 'Diagnostic type is required'],
            ],
        };

        const nextErrors = {};
        (requiredByStep[activeStep] || []).forEach(([field, message]) => {
            if (!formData[field] && formData[field] !== 0) nextErrors[field] = message;
        });

        if (formData.phone_number && !String(formData.phone_number).trim().startsWith('+')) {
            nextErrors.phone_number = 'invalid number';
        }
        if (formData.date_of_birth && dayjs(formData.date_of_birth).isAfter(dayjs(), 'day')) {
            nextErrors.date_of_birth = 'Please select a valid past date.';
        }
        if (formData.diagnosis_date && dayjs(formData.diagnosis_date).isAfter(dayjs(), 'day')) {
            nextErrors.diagnosis_date = 'Please select a valid past date.';
        }

        setFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setErrorMessage('Please correct the highlighted fields before continuing.');
            return false;
        }
        setErrorMessage('');
        return true;
    };

    const handleNext = async () => {
        if (!validateStep()) return;
        if (activeStep < 3) {
            setActiveStep(prev => prev + 1);
        } else {
            await handleSave();
        }
    };

    const handleBackStep = () => {
        setErrorMessage('');
        setFormErrors({});
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

    const formGridProps = {
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        columnGap: { xs: 0, md: 6 },
        rowGap: 4,
        alignItems: 'end',
    };

    const fieldSx = {
        minWidth: 0,
        width: '100%',
    };

    const selectMenuProps = {
        PaperProps: {
            sx: {
                bgcolor: '#0f1420',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 22px 70px rgba(2,6,23,0.58)',
                '& .MuiMenuItem-root': {
                    fontSize: 14,
                    color: 'rgba(226,232,240,0.84)',
                    '&:hover': { bgcolor: 'rgba(34,211,238,0.08)', color: '#fff' },
                    '&.Mui-selected': { bgcolor: 'rgba(34,211,238,0.12)', color: '#fff' },
                },
            },
        },
    };

    const autocompletePaperProps = {
        slotProps: {
            paper: {
                sx: {
                    bgcolor: '#0f1420',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 22px 70px rgba(2,6,23,0.58)',
                    '& .MuiAutocomplete-option': {
                        color: 'rgba(226,232,240,0.84)',
                        '&:hover': { bgcolor: 'rgba(34,211,238,0.08)', color: '#fff' },
                        '&[aria-selected="true"]': { bgcolor: 'rgba(34,211,238,0.12)', color: '#fff' },
                    },
                },
            },
        },
    };

    const unitAdornment = (unit) => ({
        endAdornment: (
            <InputAdornment position="end">
                <Typography sx={{ color: 'rgba(148,163,184,0.72)', fontSize: 11, fontFamily: 'JetBrains Mono, Roboto Mono, monospace', letterSpacing: '0.08em' }}>
                    {unit}
                </Typography>
            </InputAdornment>
        ),
    });

    const transparentFieldStyles = {
        '& .MuiInputLabel-root': {
            color: 'rgba(148,163,184,0.72)',
            fontSize: 11,
            fontFamily: 'JetBrains Mono, Roboto Mono, monospace',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            transform: 'translate(0, -9px) scale(0.78)',
            transformOrigin: 'top left',
            maxWidth: '100%',
        },
        '& .MuiInputLabel-root.Mui-focused': {
            color: '#22d3ee',
        },
        '& .MuiInputBase-root': {
            bgcolor: 'transparent',
            color: '#fff',
            borderRadius: 0,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            transition: 'border-color 0.3s ease, background-color 0.3s ease',
            px: 0,
            pt: 2,
            minHeight: 54,
            alignItems: 'flex-end',
        },
        '& .MuiInputBase-root.Mui-focused': {
            borderBottomColor: '#22d3ee',
        },
        '& .MuiOutlinedInput-notchedOutline': {
            border: '0 !important',
        },
        '& .MuiInputBase-input': {
            color: '#fff',
            fontWeight: 430,
            letterSpacing: '-0.01em',
            px: 0,
            py: 1.25,
            minWidth: 0,
            overflow: 'visible',
            textOverflow: 'clip',
        },
        '& .MuiSelect-select': {
            pr: '34px !important',
            minHeight: 'auto !important',
            overflow: 'visible !important',
            textOverflow: 'clip !important',
            whiteSpace: 'nowrap',
        },
        '& .MuiAutocomplete-inputRoot': {
            flexWrap: 'nowrap',
            pr: '34px !important',
        },
        '& .MuiAutocomplete-input': {
            minWidth: '0 !important',
            width: '100% !important',
        },
        '& textarea.MuiInputBase-input': {
            lineHeight: 1.6,
        },
        '& .MuiSelect-icon, & .MuiAutocomplete-popupIndicator, & .MuiSvgIcon-root': {
            color: 'rgba(203,213,225,0.72)',
        },
        '& .MuiFormHelperText-root': {
            color: 'rgba(148,163,184,0.58)',
            mx: 0,
            fontSize: 11,
            fontFamily: 'Inter, Plus Jakarta Sans, system-ui, sans-serif',
        },
        '& .MuiFormHelperText-root.Mui-error': {
            color: '#fb7185',
            fontFamily: 'JetBrains Mono, Roboto Mono, monospace',
            letterSpacing: '0.04em',
            textTransform: 'lowercase',
        },
        '& .MuiInputLabel-root.Mui-error': {
            color: '#fb7185',
        },
        '& .MuiInputBase-root.Mui-error': {
            borderBottomColor: '#fb7185',
        },
        '& .MuiInputBase-root.Mui-disabled': {
            opacity: 0.6,
            cursor: 'not-allowed',
            borderBottomColor: 'rgba(255,255,255,0.06)',
        },
        '& .MuiInputBase-input.Mui-disabled': {
            WebkitTextFillColor: 'rgba(255,255,255,0.72)',
            cursor: 'not-allowed',
        },
        '& .MuiInputLabel-root.Mui-disabled': {
            color: 'rgba(148,163,184,0.42)',
        },
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Grid {...formGridProps}>
                        <Grid item xs={12} md={6} sx={{ order: { md: 1 } }}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                required
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                variant="outlined"
                                placeholder="Enter your full name"
                                disabled={Boolean(formData.fullName)}
                                error={Boolean(getLiveFieldError('fullName'))}
                                helperText={getLiveFieldError('fullName')}
                                sx={fieldSx}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ order: { md: 2 } }}>
                            <Autocomplete
                                fullWidth
                                {...autocompletePaperProps}
                                disabled
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
                                        error={Boolean(getLiveFieldError('gender'))}
                                        helperText={getLiveFieldError('gender')}
                                        sx={fieldSx}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ order: { md: 4 } }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    disabled
                                    label="Date of Birth"
                                    value={formData.date_of_birth}
                                    onChange={(newValue) => handleInputChange('date_of_birth', newValue)}
                                    slotProps={{ textField: { fullWidth: true, required: true, variant: "outlined", error: Boolean(getLiveFieldError('date_of_birth')), helperText: getLiveFieldError('date_of_birth'), sx: fieldSx }, openPickerButton: { sx: { color: 'rgba(203,213,225,0.72)', mr: -1 } } }}
                                    maxDate={dayjs()}
                                    sx={{ width: '100%' }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ order: { md: 5 } }}>
                            <TextField
                                select
                                fullWidth
                                required
                                label="Country / Region"
                                value={formData.country}
                                SelectProps={{ MenuProps: selectMenuProps }}
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
                                error={Boolean(getLiveFieldError('country'))}
                                helperText={getLiveFieldError('country')}
                                sx={fieldSx}
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
                        <Grid item xs={12} md={6} sx={{ order: { md: 3 } }}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                required
                                value={formData.phone_number}
                                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                variant="outlined"
                                placeholder={formData.country_code ? `${formData.country_code} XXXXXXXXXX` : "Enter phone number"}
                                disabled={Boolean(formData.phone_number)}
                                error={Boolean(getLiveFieldError('phone_number'))}
                                helperText={getLiveFieldError('phone_number') || (formData.country_code ? `Format: ${formData.country_code} followed by your number` : 'Select country first')}
                                sx={fieldSx}
                            />
                        </Grid>
                    </Grid>
                );

            case 1:
                return (
                    <Grid {...formGridProps}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Weight (kg)"
                                type="number"
                                required
                                value={formData.weight}
                                onChange={(e) => handleInputChange('weight', e.target.value)}
                                variant="outlined"
                                error={Boolean(getLiveFieldError('weight'))}
                                helperText={getLiveFieldError('weight')}
                                sx={fieldSx}
                                placeholder="e.g., 70"
                                InputProps={unitAdornment('kg')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                select
                                fullWidth
                                label="Height (ft)"
                                required
                                value={formData.heightFeet}
                                SelectProps={{ MenuProps: selectMenuProps }}
                                onChange={(e) => {
                                    handleInputChange('heightFeet', e.target.value);
                                    const feet = parseFloat(e.target.value) || 0;
                                    const inches = parseFloat(formData.heightInches) || 0;
                                    const totalCm = Math.round((feet * 30.48) + (inches * 2.54));
                                    handleInputChange('height', totalCm);
                                }}
                                variant="outlined"
                                error={Boolean(getLiveFieldError('heightFeet'))}
                                helperText={getLiveFieldError('heightFeet')}
                                sx={fieldSx}
                            >
                                {[3, 4, 5, 6, 7, 8].map(ft => (
                                    <MenuItem key={ft} value={ft}>{ft} ft</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                select
                                fullWidth
                                label="Height (in)"
                                required
                                value={formData.heightInches}
                                SelectProps={{ MenuProps: selectMenuProps }}
                                onChange={(e) => {
                                    handleInputChange('heightInches', e.target.value);
                                    const feet = parseFloat(formData.heightFeet) || 0;
                                    const inches = parseFloat(e.target.value) || 0;
                                    const totalCm = Math.round((feet * 30.48) + (inches * 2.54));
                                    handleInputChange('height', totalCm);
                                }}
                                variant="outlined"
                                error={Boolean(getLiveFieldError('heightInches'))}
                                helperText={getLiveFieldError('heightInches')}
                                sx={fieldSx}
                            >
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(inch => (
                                    <MenuItem key={inch} value={inch}>{inch} in</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                fullWidth
                                {...autocompletePaperProps}
                                options={['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active']}
                                value={formData.activity_level || null}
                                onChange={(e, newValue) => handleInputChange('activity_level', newValue || '')}
                                disableClearable
                                renderInput={(params) => (
                                    <TextField {...params} fullWidth label="Activity Level" placeholder="Select activity level" error={Boolean(getLiveFieldError('activity_level'))} helperText={getLiveFieldError('activity_level')} sx={fieldSx} />
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
                                InputProps={unitAdornment('hrs')}
                                error={Boolean(getLiveFieldError('sleep_hours'))}
                                helperText={getLiveFieldError('sleep_hours')}
                                sx={fieldSx}
                            />
                        </Grid>
                    </Grid>
                );

            case 2:
                return (
                    <Grid {...formGridProps}>
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                fullWidth
                                {...autocompletePaperProps}
                                disabled
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
                                    disabled
                                    label="Diagnosis Date"
                                    value={formData.diagnosis_date}
                                    onChange={(newVal) => handleInputChange('diagnosis_date', newVal)}
                                    slotProps={{ textField: { fullWidth: true, variant: 'outlined' }, openPickerButton: { sx: { color: 'rgba(203,213,225,0.72)', mr: -1 } } }}
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
                        <Grid item xs={12} md={6}>
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
                        <Typography variant="h6" gutterBottom fontWeight={520} sx={{ color: '#fff' }}>
                            Review Your Information
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9ca3af' }} paragraph>
                            Please review your information before saving.
                        </Typography>

                        <Card variant="outlined" sx={{ mb: 2, p: 2, bgcolor: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}>
                            <Typography variant="subtitle2" fontWeight={520} gutterBottom>Basic Information</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Full Name:</Typography>
                                    <Typography variant="body1" sx={{ color: '#fff' }}>{formData.fullName || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Date of Birth:</Typography>
                                    <Typography variant="body1" sx={{ color: '#fff' }}>
                                        {formData.date_of_birth ? formData.date_of_birth.format('MMM DD, YYYY') : 'Not provided'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Gender:</Typography>
                                    <Typography variant="body1" sx={{ color: '#fff' }}>{formData.gender || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Phone:</Typography>
                                    <Typography variant="body1" sx={{ color: '#fff' }}>
                                        {formatPhoneNumber(formData.phone_number, formData.country_code)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Card>

                        <Card variant="outlined" sx={{ mb: 2, p: 2, bgcolor: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}>
                            <Typography variant="subtitle2" fontWeight={520} gutterBottom>Lifestyle Information</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Weight:</Typography>
                                    <Typography variant="body1" sx={{ color: '#fff' }}>{formData.weight ? `${formData.weight} kg` : 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Height:</Typography>
                                    <Typography variant="body1" sx={{ color: '#fff' }}>{formData.height ? `${formData.height} cm` : 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Activity Level:</Typography>
                                    <Typography variant="body1" sx={{ color: '#fff' }}>{formData.activity_level || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Sleep Hours:</Typography>
                                    <Typography variant="body1" sx={{ color: '#fff' }}>{formData.sleep_hours ? `${formData.sleep_hours} hrs` : 'Not provided'}</Typography>
                                </Grid>
                            </Grid>
                        </Card>

                        <Card variant="outlined" sx={{ p: 2, bgcolor: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}>
                            <Typography variant="subtitle2" fontWeight={520} gutterBottom>Medical History</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Diabetes Type:</Typography>
                                    <Typography variant="body1" sx={{ color: '#fff' }}>{formData.diabetes_type || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Diagnosis Date:</Typography>
                                    <Typography variant="body1" sx={{ color: '#fff' }}>
                                        {formData.diagnosis_date ? formData.diagnosis_date.format('MMM DD, YYYY') : 'Not provided'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Medications:</Typography>
                                    <Typography variant="body1" sx={{ color: '#fff' }}>{formData.medications || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Family History:</Typography>
                                    <Typography variant="body1" sx={{ color: '#fff' }}>{formData.family_history || 'Not provided'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Allergies:</Typography>
                                    <Typography variant="body1" sx={{ color: '#fff' }}>{formData.allergies || 'Not provided'}</Typography>
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

    const getUnitForLabel = (label) => {
        if (/weight/i.test(label)) return 'kg';
        if (/height/i.test(label)) return 'cm';
        if (/sleep/i.test(label)) return 'hrs';
        if (/age/i.test(label)) return 'yrs';
        if (/hba1c/i.test(label)) return '%';
        return '';
    };

    const formatPhoneNumber = (phone, countryCode) => {
        const cleanPhone = String(phone || '').trim().replace(/\s+/g, '');
        const cleanCode = String(countryCode || '').trim();
        if (!cleanPhone) return 'Not provided';
        if (cleanPhone.startsWith('+')) return cleanPhone;
        return cleanCode ? `${cleanCode}${cleanPhone}` : cleanPhone;
    };

    const isTechnicalValue = (label) => (
        /date|weight|height|sleep|phone|diagnosis|type/i.test(label)
    );

    const summaryGridSx = {
        display: 'grid',
        gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(3, minmax(0, 1fr))',
        },
        columnGap: { xs: 0, md: 6 },
        rowGap: 4,
        alignItems: 'stretch',
    };

    const renderField = (label, value, isEmpty = false) => (
        <Box 
            sx={{ 
                py: 2,
                minWidth: 0,
                borderBottom: '1px solid rgba(45,212,191,0.2)',
                transition: 'all 0.25s ease',
                '&:hover': {
                    borderBottomColor: 'rgba(45,212,191,0.45)',
                }
            }}
        >
            <Typography 
                variant="caption" 
                sx={{ 
                    fontWeight: 700, 
                    textTransform: 'uppercase',
                    color: 'rgba(148,163,184,0.72)',
                    letterSpacing: '0.12em',
                    fontSize: '0.68rem',
                    fontFamily: 'JetBrains Mono, Roboto Mono, monospace',
                }}
            >
                {label}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2 }}>
                <Typography
                    variant="body1"
                    sx={{
                        color: isEmpty ? 'rgba(148,163,184,0.62)' : '#fff',
                        fontStyle: isEmpty ? 'italic' : 'normal',
                        fontWeight: isEmpty ? 400 : 480,
                        fontSize: '0.98rem',
                        letterSpacing: '-0.01em',
                        overflowWrap: 'anywhere',
                        fontFamily: isTechnicalValue(label) ? 'JetBrains Mono, Roboto Mono, monospace' : 'Inter, Plus Jakarta Sans, system-ui, sans-serif',
                    }}
                >
                    {isEmpty ? 'Not provided' : value}
                </Typography>
                {!isEmpty && getUnitForLabel(label) && (
                    <Typography sx={{ color: 'rgba(148,163,184,0.72)', fontSize: 11, fontFamily: 'JetBrains Mono, Roboto Mono, monospace', letterSpacing: '0.08em' }}>
                        {getUnitForLabel(label)}
                    </Typography>
                )}
            </Box>
        </Box>
    );

    if (loading) {
        return (
            <Box sx={{ minHeight: inModal ? '60vh' : '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#090d16' }}>
                <CircularProgress size={24} sx={{ color: '#22d3ee' }} />
            </Box>
        );
    }

    // Show error message if data fetch failed
    if (fetchError) {
        return (
            <Box sx={{ minHeight: inModal ? '60vh' : '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#090d16' }}>
                <Container maxWidth="md">
                    <Card elevation={0} sx={{ borderRadius: 1.5, p: 4, textAlign: 'center', bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>
                        <WarningIcon sx={{ fontSize: 64, color: '#dc2626', mb: 2 }} />
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            {fetchError}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9ca3af' }} paragraph>
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
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#090d16' }}>
                <Container maxWidth="md">
                    <Card elevation={0} sx={{ borderRadius: 1.5, p: 4, textAlign: 'center', bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            No Information Found
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9ca3af' }} paragraph>
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
        <Box sx={{ minHeight: inModal ? 'auto' : '100vh', bgcolor: '#090d16', py: inModal ? 3 : 4, color: '#fff' }}>
            <Container maxWidth="md" sx={{ px: { xs: 2, md: 4 } }}>
                {/* Header - Only show when not in modal */}
                {!inModal && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={handleBack}
                            sx={{ mr: 2, textTransform: 'none', color: '#cbd5e1' }}
                        >
                            Back
                        </Button>
                        <Box>
                            <Typography variant="h4" fontWeight={540} sx={{ color: '#fff', letterSpacing: '-0.045em' }}>
                                Personal & Medical Information
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                                View and manage your health profile
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* Personal Information Card */}
                <Card elevation={0} sx={{ mb: 4, borderRadius: 0, overflow: 'visible', border: 'none', bgcolor: 'transparent', color: '#fff' }}>
                    <Box
                        sx={{
                            borderBottom: '1px solid rgba(45,212,191,0.28)',
                            pb: 2.5,
                            mb: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography variant="h5" fontWeight={520} sx={{ color: '#ffffff', mb: 0.5, letterSpacing: '-0.03em' }}>
                                Personal Information
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                                Basic profile details
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexShrink: 0 }}>
                            <Box 
                                sx={{ 
                                    textAlign: 'right',
                                    px: 0,
                                    py: 0,
                                }}
                            >
                                <Typography sx={{ color: '#67e8f9', fontFamily: 'JetBrains Mono, Roboto Mono, monospace', fontSize: 15, fontWeight: 500, letterSpacing: '0.08em' }}>
                                    {personalCompletion}% COMPLETE
                                </Typography>
                            </Box>
                            {personalCompletion === 100 && (
                                <CheckCircleIcon sx={{ color: '#10b981', fontSize: 24, filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.35))' }} />
                            )}
                        </Box>
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ pt: 2, pb: 1 }}>
                        <LinearProgress
                            variant="determinate"
                            value={personalCompletion}
                            sx={{
                                height: 2,
                                borderRadius: 999,
                                bgcolor: 'rgba(255,255,255,0.07)',
                                '& .MuiLinearProgress-bar': {
                                    background: 'linear-gradient(90deg, #22d3ee 0%, #34d399 100%)',
                                    borderRadius: 999,
                                },
                            }}
                        />
                    </Box>

                    <CardContent sx={{ px: 0, py: 3 }}>
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={4}>
                                {renderField('Full Name', personalInfo?.fullName, !personalInfo?.fullName)}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                {renderField('Gender', personalInfo?.gender, !personalInfo?.gender)}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                {renderField(
                                    'Date of Birth',
                                    personalInfo?.date_of_birth
                                        ? formatDate(personalInfo.date_of_birth)
                                        : 'Not provided',
                                    !personalInfo?.date_of_birth
                                )}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                {renderField('Phone Number', formatPhoneNumber(personalInfo?.phone_number, personalInfo?.country_code), !personalInfo?.phone_number)}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                {renderField('Weight (kg)', personalInfo?.weight, !personalInfo?.weight)}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                {renderField('Height (cm)', personalInfo?.height, !personalInfo?.height)}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                {renderField('Activity Level', personalInfo?.activity_level, !personalInfo?.activity_level)}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                {renderField('Sleep Hours', personalInfo?.sleep_hours, !personalInfo?.sleep_hours)}
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Medical Information Card */}
                <Card elevation={0} sx={{ mb: 4, borderRadius: 0, overflow: 'visible', border: 'none', bgcolor: 'transparent', color: '#fff' }}>
                    <Box
                        sx={{
                            borderBottom: '1px solid rgba(45,212,191,0.28)',
                            pb: 2.5,
                            mb: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography variant="h5" fontWeight={520} sx={{ color: '#ffffff', mb: 0.5, letterSpacing: '-0.03em' }}>
                                Medical Information
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                                Health history and current status
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexShrink: 0 }}>
                            <Box 
                                sx={{ 
                                    textAlign: 'right',
                                    px: 0,
                                    py: 0,
                                }}
                            >
                                <Typography sx={{ color: '#34d399', fontFamily: 'JetBrains Mono, Roboto Mono, monospace', fontSize: 15, fontWeight: 500, letterSpacing: '0.08em' }}>
                                    {medicalCompletion}% COMPLETE
                                </Typography>
                            </Box>
                            {medicalCompletion === 100 && (
                                <CheckCircleIcon sx={{ color: '#ffffff', fontSize: 24, filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.24))' }} />
                            )}
                        </Box>
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ pt: 2, pb: 1 }}>
                        <LinearProgress
                            variant="determinate"
                            value={medicalCompletion}
                            sx={{
                                height: 2,
                                borderRadius: 999,
                                bgcolor: 'rgba(255,255,255,0.07)',
                                '& .MuiLinearProgress-bar': {
                                    background: 'linear-gradient(90deg, #22d3ee 0%, #34d399 100%)',
                                    borderRadius: 999,
                                },
                            }}
                        />
                    </Box>

                    <CardContent sx={{ px: 0, py: 3 }}>
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={4}>
                                {renderField('Diabetes Type', medicalInfo?.diabetes_type, !medicalInfo?.diabetes_type)}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                {renderField(
                                    'Diagnosis Date',
                                    medicalInfo?.diagnosis_date
                                        ? formatDate(medicalInfo.diagnosis_date)
                                        : 'Not provided',
                                    !medicalInfo?.diagnosis_date
                                )}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                {renderField(
                                    'Previous Diagnosis',
                                    medicalInfo?.previous_diagnosis,
                                    !medicalInfo?.previous_diagnosis
                                )}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                {renderField(
                                    'Current Medications',
                                    medicalInfo?.medications,
                                    !medicalInfo?.medications
                                )}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                {renderField(
                                    'Allergies',
                                    medicalInfo?.allergies,
                                    !medicalInfo?.allergies
                                )}
                            </Grid>
                            <Grid item xs={12} md={4}>
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
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 6, mb: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={handleEditClick}
                        sx={{
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            px: 5,
                            py: 1.5,
                            borderRadius: 1.5,
                            bgcolor: '#111827',
                            borderColor: 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            boxShadow: 'none',
                            fontWeight: 520,
                            '&:hover': {
                                borderColor: 'rgba(34,211,238,0.45)',
                                bgcolor: 'rgba(34,211,238,0.08)',
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
                        borderRadius: 1.5,
                        maxHeight: '90vh',
                        bgcolor: '#0f1420',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 28px 90px rgba(2,6,23,0.62)',
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1, px: 3.5, pt: 3 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={520} sx={{ color: '#fff', letterSpacing: '-0.035em' }}>
                            Edit Personal & Medical Information
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                            Update your profile information
                        </Typography>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ pt: 2, px: 3.5, ...transparentFieldStyles }}>
                    {/* Progress Bar */}
                    <LinearProgress 
                        variant="determinate" 
                        value={getProgress()} 
                        sx={{ height: 2, borderRadius: 999, mb: 3, bgcolor: 'rgba(255,255,255,0.07)', '& .MuiLinearProgress-bar': { bgcolor: '#22d3ee' } }}
                    />

                    {/* Stepper */}
                    <Stepper
                        activeStep={activeStep}
                        alternativeLabel
                        sx={{
                            mb: 4,
                            '& .MuiStepConnector-line': {
                                borderColor: 'rgba(255,255,255,0.08)',
                                borderTopWidth: 1,
                            },
                            '& .MuiStepLabel-label': {
                                color: 'rgba(148,163,184,0.62) !important',
                                fontSize: 11,
                                fontFamily: 'JetBrains Mono, Roboto Mono, monospace',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                            },
                            '& .MuiStepIcon-root': {
                                color: 'rgba(255,255,255,0.12)',
                                borderRadius: '50%',
                            },
                            '& .MuiStepIcon-root.Mui-active': {
                                color: '#22d3ee',
                                filter: 'drop-shadow(0 0 12px rgba(34,211,238,0.55))',
                            },
                            '& .MuiStepIcon-root.Mui-completed': {
                                color: '#2dd4bf',
                            },
                            '& .MuiStepIcon-text': {
                                fill: '#020617',
                                fontFamily: 'JetBrains Mono, Roboto Mono, monospace',
                                fontWeight: 600,
                            },
                        }}
                    >
                        {steps.map((step) => (
                            <Step key={step.label}>
                                <StepLabel>
                                    <Typography variant="subtitle2" fontWeight={520} sx={{ color: '#fff' }}>
                                        {step.label}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                                        {step.description}
                                    </Typography>
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {/* Success/Error Messages */}
                    {successMessage && (
                        <Fade in={!!successMessage}>
                            <Alert severity="success" sx={{ mb: 3, bgcolor: 'rgba(6,78,59,0.22)', color: '#bbf7d0', border: '1px solid rgba(52,211,153,0.18)' }}>
                                {successMessage}
                            </Alert>
                        </Fade>
                    )}
                    {errorMessage && (
                        <Fade in={!!errorMessage}>
                            <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(127,29,29,0.22)', color: '#fecaca', border: '1px solid rgba(248,113,113,0.18)' }}>
                                {errorMessage}
                            </Alert>
                        </Fade>
                    )}

                    {/* Step Content */}
                    <Box sx={{ minHeight: 300 }}>
                        {renderStepContent()}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <Button 
                        onClick={handleCloseEdit}
                        disabled={savingData}
                        sx={{ textTransform: 'none', color: '#cbd5e1' }}
                    >
                        Cancel
                    </Button>
                    {activeStep > 0 && (
                        <Button 
                            onClick={handleBackStep}
                            disabled={savingData}
                            sx={{ textTransform: 'none', color: '#cbd5e1' }}
                        >
                            Back
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        onClick={handleNext}
                        disabled={savingData}
                        sx={{ 
                            textTransform: 'none',
                            px: 3,
                            color: '#fff',
                            bgcolor: '#111827',
                            borderColor: 'rgba(255,255,255,0.1)',
                            '&:hover': { borderColor: 'rgba(34,211,238,0.45)', bgcolor: 'rgba(34,211,238,0.08)' },
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
