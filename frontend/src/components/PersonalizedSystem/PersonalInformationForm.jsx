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
    Card,
    CardContent,
    Divider,
    Chip,
    InputAdornment,
    Fade,
    Zoom,
    Avatar,
    LinearProgress,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { alpha } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HomeIcon from '@mui/icons-material/Home';
import HeightIcon from '@mui/icons-material/Height';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import SmokingRoomsIcon from '@mui/icons-material/SmokingRooms';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import CakeIcon from '@mui/icons-material/Cake';
import WcIcon from '@mui/icons-material/Wc';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axiosInstance from '../../utils/axiosInstance';

const PersonalInformationForm = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [formData, setFormData] = useState({
        date_of_birth: null,
        gender: '',
        country: '',
        country_code: '',
        phone_number: '',
        height: '',
        heightFeet: '',
        heightInches: '',
        weight: '',
        activity_level: '',
        dietary_preference: '',
        smoking_status: '',
        alcohol_use: '',
        sleep_hours: '',
        emergency_contact: {
            name: '',
            phone: '',
            relationship: '',
        },
        address: {
            street: '',
            city: '',
            state: '',
            zip_code: '',
            country: '',
        },
    });

    useEffect(() => {
        fetchPersonalInfo();
    }, []);

    const fetchPersonalInfo = async () => {
        setLoading(true);
        try {
            // First, get current user data to pre-fill gender and DOB
            const userResponse = await axiosInstance.get('/auth/user');
            const userData = userResponse.data.data.user;
            
            const response = await axiosInstance.get('/personalized-system/personal-info');
            if (response.data.success) {
                const data = response.data.data;
                // Convert height from cm to feet and inches if available
                let heightFeet = '';
                let heightInches = '';
                if (data.height) {
                    const totalInches = data.height / 2.54;
                    heightFeet = Math.floor(totalInches / 12);
                    heightInches = Math.round(totalInches % 12);
                }
                setFormData({
                    // Use gender and DOB from User model if not already set in UserPersonalInfo
                    date_of_birth: data.date_of_birth 
                        ? new Date(data.date_of_birth) 
                        : (userData.date_of_birth ? new Date(userData.date_of_birth) : null),
                    gender: data.gender || userData.gender || '',
                    country: data.country || '',
                    country_code: data.country_code || '',
                    phone_number: data.phone_number || '',
                    height: data.height || '',
                    heightFeet: heightFeet,
                    heightInches: heightInches,
                    weight: data.weight || '',
                    activity_level: data.activity_level || '',
                    dietary_preference: data.dietary_preference || '',
                    smoking_status: data.smoking_status || '',
                    alcohol_use: data.alcohol_use || '',
                    sleep_hours: data.sleep_hours || '',
                    emergency_contact: data.emergency_contact || {
                        name: '',
                        phone: '',
                        relationship: '',
                    },
                    address: data.address || {
                        street: '',
                        city: '',
                        state: '',
                        zip_code: '',
                        country: '',
                    },
                });
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                // If personal info not found, still try to get user data
                try {
                    const userResponse = await axiosInstance.get('/auth/user');
                    const userData = userResponse.data.data.user;
                    setFormData(prev => ({
                        ...prev,
                        date_of_birth: userData.date_of_birth ? new Date(userData.date_of_birth) : null,
                        gender: userData.gender || '',
                    }));
                } catch (userErr) {
                    setError('Failed to load personal information.');
                }
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.date_of_birth || !formData.gender || !formData.country || !formData.phone_number || !formData.height || !formData.weight) {
            setError('Date of birth, gender, country, phone number, height, and weight are required.');
            return;
        }

        setSaving(true);
        try {
            const response = await axiosInstance.post('/personalized-system/personal-info', formData);
            if (response.data.success) {
                setSuccess('Personal information saved successfully!');
                setTimeout(() => setSuccess(''), 5000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save personal information.');
        } finally {
            setSaving(false);
        }
    };

    // Calculate form completion percentage
    const calculateCompletion = () => {
        const fields = [
            formData.date_of_birth,
            formData.gender,
            formData.height,
            formData.weight,
            formData.activity_level,
            formData.dietary_preference,
            formData.smoking_status,
            formData.alcohol_use,
            formData.sleep_hours,
            formData.emergency_contact.name,
            formData.emergency_contact.phone,
            formData.address.city,
        ];
        const filled = fields.filter(f => f && f !== '').length;
        return Math.round((filled / fields.length) * 100);
    };

    const completion = calculateCompletion();

    if (loading) {
        return (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px" gap={2}>
                <CircularProgress size={60} thickness={4} />
                <Typography variant="h6" color="text.secondary">Loading your information...</Typography>
            </Box>
        );
    }

    return (
        <Fade in timeout={800}>
            <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
                {/* Header Section */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 4, 
                        mb: 4,
                        borderRadius: 4,
                        background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                >
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <Avatar 
                            sx={{ 
                                width: 70, 
                                height: 70, 
                                bgcolor: 'primary.main',
                                boxShadow: 3,
                            }}
                        >
                            <PersonIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                        <Box flex={1}>
                            <Typography variant="h4" fontWeight={800} gutterBottom>
                                Personal Information
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Help us personalize your experience by sharing your information
                            </Typography>
                        </Box>
                    </Box>
                    
                    {/* Progress Bar */}
                    <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="body2" fontWeight={600} color="text.secondary">
                                Profile Completion
                            </Typography>
                            <Chip 
                                label={`${completion}%`} 
                                size="small" 
                                color={completion === 100 ? "success" : "primary"}
                                icon={completion === 100 ? <CheckCircleIcon /> : undefined}
                            />
                        </Box>
                        <LinearProgress 
                            variant="determinate" 
                            value={completion} 
                            sx={{ 
                                height: 8, 
                                borderRadius: 2,
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                            }}
                        />
                    </Box>
                </Paper>

                {error && (
                    <Zoom in>
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    </Zoom>
                )}
                {success && (
                    <Zoom in>
                        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess('')}>
                            {success}
                        </Alert>
                    </Zoom>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Single Card with All Sections */}
                    <Card 
                        elevation={0}
                        sx={{ 
                            borderRadius: 4,
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: 6,
                            }
                        }}
                    >
                        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                            {/* Basic Information Section */}
                            <Box mb={5}>
                                <Box display="flex" alignItems="center" gap={2} mb={3}>
                                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                                        <PersonIcon sx={{ fontSize: 30 }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>
                                            Basic Information
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Essential details about you
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                            <DatePicker
                                                label="Date of Birth"
                                                value={formData.date_of_birth}
                                                onChange={(date) => handleChange('date_of_birth', date)}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        required: true,
                                                        InputProps: {
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <CakeIcon color="action" />
                                                                </InputAdornment>
                                                            ),
                                                        },
                                                        sx: { width: '100%' }
                                                    },
                                                }}
                                            />
                                        </LocalizationProvider>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            required
                                            label="Gender"
                                            value={formData.gender}
                                            onChange={(e) => handleChange('gender', e.target.value)}
                                            sx={{ width: '100%' }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <WcIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        >
                                            <MenuItem value="Male">Male</MenuItem>
                                            <MenuItem value="Female">Female</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
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
                                                handleChange('country', selectedCountry);
                                                handleChange('country_code', countryCodes[selectedCountry] || '');
                                            }}
                                            sx={{ width: '100%' }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <ContactPhoneIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
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
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Phone Number"
                                            value={formData.phone_number}
                                            onChange={(e) => handleChange('phone_number', e.target.value)}
                                            placeholder="Enter your phone number"
                                            sx={{ width: '100%' }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <ContactPhoneIcon color="action" />
                                                        {formData.country_code && (
                                                            <Typography variant="body2" sx={{ ml: 1, mr: 1, color: 'text.secondary', fontWeight: 600 }}>
                                                                {formData.country_code}
                                                            </Typography>
                                                        )}
                                                    </InputAdornment>
                                                ),
                                            }}
                                            helperText={formData.country_code ? `Phone format: ${formData.country_code} XXXXXXXXXX` : 'Select country first to see code'}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <TextField
                                            select
                                            fullWidth
                                            required
                                            label="Height (ft)"
                                            value={formData.heightFeet || ''}
                                            onChange={(e) => {
                                                handleChange('heightFeet', e.target.value);
                                                const feet = parseFloat(e.target.value) || 0;
                                                const inches = parseFloat(formData.heightInches) || 0;
                                                const totalCm = Math.round((feet * 30.48) + (inches * 2.54));
                                                handleChange('height', totalCm);
                                            }}
                                            sx={{ width: '100%' }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <HeightIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        >
                                            {[3, 4, 5, 6, 7, 8].map(ft => (
                                                <MenuItem key={ft} value={ft}>{ft} ft</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <TextField
                                            select
                                            fullWidth
                                            required
                                            label="Height (in)"
                                            value={formData.heightInches || ''}
                                            onChange={(e) => {
                                                handleChange('heightInches', e.target.value);
                                                const feet = parseFloat(formData.heightFeet) || 0;
                                                const inches = parseFloat(e.target.value) || 0;
                                                const totalCm = Math.round((feet * 30.48) + (inches * 2.54));
                                                handleChange('height', totalCm);
                                            }}
                                            sx={{ width: '100%' }}
                                        >
                                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(inch => (
                                                <MenuItem key={inch} value={inch}>{inch} in</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            required
                                            type="number"
                                            label="Weight"
                                            value={formData.weight}
                                            onChange={(e) => handleChange('weight', e.target.value)}
                                            sx={{ width: '100%' }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <MonitorWeightIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <Chip label="kg" size="small" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            <Divider sx={{ my: 4 }} />

                            {/* Lifestyle Information Section */}
                            <Box mb={5}>
                                <Box display="flex" alignItems="center" gap={2} mb={3}>
                                    <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                                        <FitnessCenterIcon sx={{ fontSize: 30 }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>
                                            Lifestyle & Habits
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Your daily routines and preferences
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Activity Level"
                                            value={formData.activity_level}
                                            onChange={(e) => handleChange('activity_level', e.target.value)}
                                            sx={{ width: '100%' }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <DirectionsRunIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        >
                                            <MenuItem value="Sedentary">🛋️ Sedentary</MenuItem>
                                            <MenuItem value="Lightly Active">🚶 Lightly Active</MenuItem>
                                            <MenuItem value="Moderately Active">🏃 Moderately Active</MenuItem>
                                            <MenuItem value="Very Active">💪 Very Active</MenuItem>
                                            <MenuItem value="Extremely Active">🏋️ Extremely Active</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Dietary Preference"
                                            value={formData.dietary_preference}
                                            onChange={(e) => handleChange('dietary_preference', e.target.value)}
                                            sx={{ width: '100%' }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <RestaurantIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        >
                                            <MenuItem value="Vegetarian">🥗 Vegetarian</MenuItem>
                                            <MenuItem value="Non-Vegetarian">🍖 Non-Vegetarian</MenuItem>
                                            <MenuItem value="Vegan">🌱 Vegan</MenuItem>
                                            <MenuItem value="Pescatarian">🐟 Pescatarian</MenuItem>
                                            <MenuItem value="Other">🍽️ Other</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Smoking Status"
                                            value={formData.smoking_status}
                                            onChange={(e) => handleChange('smoking_status', e.target.value)}
                                            sx={{ width: '100%' }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SmokingRoomsIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        >
                                            <MenuItem value="Never">✅ Never</MenuItem>
                                            <MenuItem value="Former">📅 Former</MenuItem>
                                            <MenuItem value="Current">🚬 Current</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Alcohol Use"
                                            value={formData.alcohol_use}
                                            onChange={(e) => handleChange('alcohol_use', e.target.value)}
                                            sx={{ width: '100%' }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <LocalBarIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        >
                                            <MenuItem value="Never">🚫 Never</MenuItem>
                                            <MenuItem value="Occasional">🍷 Occasional</MenuItem>
                                            <MenuItem value="Regular">🍺 Regular</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Average Sleep Hours"
                                            value={formData.sleep_hours}
                                            onChange={(e) => handleChange('sleep_hours', e.target.value)}
                                            inputProps={{ min: 0, max: 24, step: 0.5 }}
                                            sx={{ width: '100%' }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <BedtimeIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <Chip label="hrs/day" size="small" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            <Divider sx={{ my: 4 }} />

                            {/* Emergency Contact Section */}
                            <Box mb={5}>
                                <Box display="flex" alignItems="center" gap={2} mb={3}>
                                    <Avatar sx={{ bgcolor: 'error.main', width: 56, height: 56 }}>
                                        <LocalHospitalIcon sx={{ fontSize: 30 }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>
                                            Emergency Contact
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Someone we can reach in case of emergency
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Contact Name"
                                            value={formData.emergency_contact.name}
                                            onChange={(e) => handleNestedChange('emergency_contact', 'name', e.target.value)}
                                            sx={{ width: '100%' }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <PersonIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Contact Phone"
                                            value={formData.emergency_contact.phone}
                                            onChange={(e) => handleNestedChange('emergency_contact', 'phone', e.target.value)}
                                            sx={{ width: '100%' }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <ContactPhoneIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Relationship"
                                            value={formData.emergency_contact.relationship}
                                            onChange={(e) => handleNestedChange('emergency_contact', 'relationship', e.target.value)}
                                            placeholder="e.g., Parent, Spouse, Sibling"
                                            sx={{ width: '100%' }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            <Divider sx={{ my: 4 }} />

                            {/* Address Section */}
                            <Box mb={4}>
                                <Box display="flex" alignItems="center" gap={2} mb={3}>
                                    <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                                        <HomeIcon sx={{ fontSize: 30 }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>
                                            Address Information
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Your residential details
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Street Address"
                                            value={formData.address.street}
                                            onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                                            sx={{ width: '100%' }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <HomeIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="City"
                                            value={formData.address.city}
                                            onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                                            sx={{ width: '100%' }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="State / Province"
                                            value={formData.address.state}
                                            onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                                            sx={{ width: '100%' }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Zip / Postal Code"
                                            value={formData.address.zip_code}
                                            onChange={(e) => handleNestedChange('address', 'zip_code', e.target.value)}
                                            sx={{ width: '100%' }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Country"
                                            value={formData.address.country}
                                            onChange={(e) => handleNestedChange('address', 'country', e.target.value)}
                                            sx={{ width: '100%' }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <Box mt={3}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            sx={{ 
                                py: 2,
                                borderRadius: 3,
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                textTransform: 'none',
                                boxShadow: 4,
                                '&:hover': {
                                    boxShadow: 8,
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {saving ? 'Saving Your Information...' : 'Save Personal Information'}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Fade>
    );
};

export default PersonalInformationForm;
