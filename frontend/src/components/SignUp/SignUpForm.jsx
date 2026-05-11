import React, { useState } from 'react';
import { useDateFormat } from '../../hooks/useDateFormat';
import axiosInstance from '../../utils/axiosInstance';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Link,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Alert,
    IconButton,
    InputAdornment,
    alpha,
    LinearProgress,
    Chip,
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { motion, AnimatePresence } from 'framer-motion';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTheme } from '@mui/material/styles';

const steps = ['Personal Info', 'Account Details', 'Complete'];

const passwordRequirements = [
    { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { label: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { label: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { label: 'One number', test: (pwd) => /\d/.test(pwd) },
    { label: 'One special character', test: (pwd) => /[^A-Za-z0-9]/.test(pwd) },
];

export default function SignUpForm({ setSuccess, setError }) {
    const [activeStep, setActiveStep] = useState(0);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [dob, setDob] = useState(null);
    const [gender, setGender] = useState('');
    const [loading, setLoading] = useState(false);
    const [successLocal, setSuccessLocal] = useState('');
    const [errorLocal, setErrorLocal] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const navigate = useNavigate();
    const theme = useTheme();
    const { formatDate } = useDateFormat();

    const validateStep = (step) => {
        if (step === 0) {
            if (!fullName || !dob || !gender) {
                const errorMsg = 'Please fill in all personal information fields.';
                setErrorLocal(errorMsg);
                if (setError) setError(errorMsg);
                return false;
            }
        } else if (step === 1) {
            if (!email || !password) {
                const errorMsg = 'Email and password are required.';
                setErrorLocal(errorMsg);
                if (setError) setError(errorMsg);
                return false;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                const errorMsg = 'Invalid email format.';
                setErrorLocal(errorMsg);
                if (setError) setError(errorMsg);
                return false;
            }
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
            if (!passwordRegex.test(password)) {
                const errorMsg = 'Password does not meet requirements.';
                setErrorLocal(errorMsg);
                if (setError) setError(errorMsg);
                return false;
            }
        }
        setErrorLocal('');
        if (setError) setError('');
        return true;
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
        setErrorLocal('');
        if (setError) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(activeStep)) return;
        setLoading(true);
        setSuccessLocal('');
        setErrorLocal('');
        if (setSuccess) setSuccess('');
        if (setError) setError('');
        try {
            const res = await axiosInstance.post('/auth/register', {
                fullName,
                email,
                password,
                gender,
                date_of_birth: dob,
            });
            
            // Check if user came from onboarding
            const fromOnboarding = sessionStorage.getItem('pendingOnboardingAnswers');
            const returnToAssessment = sessionStorage.getItem('returnToSymptomAssessment');
            
            if (fromOnboarding || returnToAssessment) {
                const successMsg = 'Account created! Please check your email to activate your account. After activation, your onboarding answers will be saved.';
                setSuccessLocal(successMsg);
                if (setSuccess) setSuccess(successMsg);
                // Don't clear pending answers yet - they'll be saved after email verification and login
                
                // Redirect to signin with returnTo parameter if needed
                if (returnToAssessment === 'true') {
                    setTimeout(() => navigate('/signin?returnTo=symptom-assessment'), 3000);
                } else {
                    setTimeout(() => navigate('/signin'), 3000);
                }
            } else {
                const successMsg = res.data.message || 'Check your email to activate your account.';
                setSuccessLocal(successMsg);
                if (setSuccess) setSuccess(successMsg);
                setTimeout(() => navigate('/signin'), 3000);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Registration failed.';
            setErrorLocal(errorMsg);
            if (setError) setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 11, today.getMonth(), today.getDate());

    const getPasswordStrength = () => {
        const passed = passwordRequirements.filter(req => req.test(password)).length;
        return (passed / passwordRequirements.length) * 100;
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 3, sm: 4 },
                    width: { xs: '100%', sm: 480 },
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
            >
                {/* Header */}
                <motion.div variants={itemVariants}>
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <Typography 
                            variant="h4" 
                            fontWeight={700}
                            sx={{ 
                                mb: 1,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Create Account
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Start your diabetes health management journey
                        </Typography>
                    </Box>
                </motion.div>

                {/* Progress Stepper */}
                <motion.div variants={itemVariants}>
                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </motion.div>

                {/* Alerts */}
                <AnimatePresence>
                    {successLocal && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <Alert severity="success" sx={{ mb: 2 }}>
                                {successLocal}
                            </Alert>
                        </motion.div>
                    )}
                    {errorLocal && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {errorLocal}
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={activeStep === steps.length - 1 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
                    <AnimatePresence mode="wait">
                        {activeStep === 0 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Full Name */}
                                <Box sx={{ mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        onFocus={() => setFocusedField('fullName')}
                                        onBlur={() => setFocusedField(null)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonIcon 
                                                        sx={{ 
                                                            color: focusedField === 'fullName' 
                                                                ? theme.palette.primary.main 
                                                                : 'text.secondary',
                                                            transition: 'color 0.3s'
                                                        }} 
                                                    />
                                                </InputAdornment>
                                            ),
                                            sx: { 
                                                backgroundColor: alpha(theme.palette.background.default, 0.5),
                                                '&.Mui-focused': {
                                                    backgroundColor: theme.palette.background.paper,
                                                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                                                }
                                            }
                                        }}
                                    />
                                </Box>

                                {/* Date of Birth */}
                                <Box sx={{ mb: 2 }}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <DatePicker
                                            label="Date of Birth"
                                            value={dob}
                                            onChange={setDob}
                                            maxDate={maxDate}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    InputProps: {
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <CalendarTodayIcon sx={{ color: 'text.secondary' }} />
                                                            </InputAdornment>
                                                        ),
                                                    },
                                                    sx: { 
                                                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                                                        '&.Mui-focused': {
                                                            backgroundColor: theme.palette.background.paper,
                                                            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                                                        }
                                                    }
                                                },
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Box>

                                {/* Gender */}
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Gender</InputLabel>
                                    <Select
                                        value={gender}
                                        onChange={e => setGender(e.target.value)}
                                        label="Gender"
                                        sx={{ 
                                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                                        }}
                                    >
                                        <MenuItem value="Male">Male</MenuItem>
                                        <MenuItem value="Female">Female</MenuItem>
                                        <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                                    </Select>
                                </FormControl>
                            </motion.div>
                        )}

                        {activeStep === 1 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Email */}
                                <Box sx={{ mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailIcon 
                                                        sx={{ 
                                                            color: focusedField === 'email' 
                                                                ? theme.palette.primary.main 
                                                                : 'text.secondary',
                                                            transition: 'color 0.3s'
                                                        }} 
                                                    />
                                                </InputAdornment>
                                            ),
                                            sx: { 
                                                backgroundColor: alpha(theme.palette.background.default, 0.5),
                                                '&.Mui-focused': {
                                                    backgroundColor: theme.palette.background.paper,
                                                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                                                }
                                            }
                                        }}
                                    />
                                </Box>

                                {/* Password */}
                                <Box sx={{ mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockIcon 
                                                        sx={{ 
                                                            color: focusedField === 'password' 
                                                                ? theme.palette.primary.main 
                                                                : 'text.secondary',
                                                            transition: 'color 0.3s'
                                                        }} 
                                                    />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                            sx: { 
                                                backgroundColor: alpha(theme.palette.background.default, 0.5),
                                                '&.Mui-focused': {
                                                    backgroundColor: theme.palette.background.paper,
                                                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                                                }
                                            }
                                        }}
                                    />
                                    
                                    {/* Password Strength */}
                                    {password && (
                                        <Box sx={{ mt: 1 }}>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={getPasswordStrength()} 
                                                sx={{ 
                                                    height: 6, 
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor: getPasswordStrength() >= 80 ? 'success.main' : 
                                                                       getPasswordStrength() >= 50 ? 'warning.main' : 'error.main',
                                                    }
                                                }} 
                                            />
                                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {passwordRequirements.map((req, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        icon={req.test(password) ? <CheckCircleIcon /> : undefined}
                                                        label={req.label}
                                                        size="small"
                                                        color={req.test(password) ? 'success' : 'default'}
                                                        variant={req.test(password) ? 'filled' : 'outlined'}
                                                        sx={{ fontSize: '0.7rem', height: 24 }}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            </motion.div>
                        )}

                        {activeStep === 2 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                                    <Typography variant="h6" fontWeight={600} gutterBottom>
                                        Review Your Information
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Please review your details before submitting
                                    </Typography>
                                    <Box sx={{ textAlign: 'left', bgcolor: alpha(theme.palette.background.default, 0.5), p: 2 }}>
                                        <Typography variant="body2"><strong>Name:</strong> {fullName}</Typography>
                                        <Typography variant="body2"><strong>Email:</strong> {email}</Typography>
                                        <Typography variant="body2"><strong>Date of Birth:</strong> {dob ? formatDate(dob) : ''}</Typography>
                                        <Typography variant="body2"><strong>Gender:</strong> {gender}</Typography>
                                    </Box>
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                        <Button
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            sx={{ textTransform: 'none' }}
                        >
                            Back
                        </Button>
                        {activeStep < steps.length - 1 ? (
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                sx={{
                                    textTransform: 'none',
                                    px: 4,
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                }}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                type="submit"
                                disabled={loading}
                                sx={{
                                    textTransform: 'none',
                                    px: 4,
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                }}
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </Button>
                        )}
                    </Box>
                </form>

                {/* Sign In Link */}
                <Typography textAlign="center" variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
                    Already have an account?{' '}
                    <Link
                        component={RouterLink}
                        to={sessionStorage.getItem('returnToSymptomAssessment') === 'true' ? '/signin?returnTo=symptom-assessment' : '/signin'}
                        sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            textDecoration: 'none',
                            '&:hover': {
                                textDecoration: 'underline',
                            },
                        }}
                    >
                        Sign in
                    </Link>
                </Typography>
            </Paper>
        </motion.div>
    );
}
