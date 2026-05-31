import React, { useCallback, useEffect, useRef, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    FormControlLabel,
    Checkbox,
    Link,
    Alert,
    IconButton,
    InputAdornment,
    alpha,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '@mui/icons-material/Google';
import { useTheme } from '@mui/material/styles';

export default function SignInForm({ setSuccess, setError, navigate }) {
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleProfileStep, setGoogleProfileStep] = useState(false);
    const [pendingAuthPayload, setPendingAuthPayload] = useState(null);
    const [profileDob, setProfileDob] = useState('');
    const [profileGender, setProfileGender] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState('');
    const googleButtonContainerRef = useRef(null);
    const theme = useTheme();
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const getPendingOnboardingAnswers = () => {
        const pendingAnswersRaw = sessionStorage.getItem('pendingOnboardingAnswers');
        if (!pendingAnswersRaw) return [];

        const parsed = JSON.parse(pendingAnswersRaw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed?.answers && typeof parsed.answers === 'object') {
            return Object.entries(parsed.answers).map(([questionId, answerText]) => ({
                questionId,
                answerText: typeof answerText === 'object' ? JSON.stringify(answerText) : String(answerText),
            }));
        }
        return [];
    };

    const savePendingOnboardingAnswers = async () => {
        const pendingAnswers = getPendingOnboardingAnswers();
        if (!pendingAnswers.length) return false;

        await axiosInstance.post('/questions/batch-save-answers', {
            answers: pendingAnswers,
        });
        sessionStorage.setItem('answersSavedAfterLogin', 'true');
        return true;
    };

    const handleAuthSuccess = async (payload, options = {}) => {
        if (payload?.data?.user && payload?.data?.accessToken) {
            localStorage.setItem('accessToken', payload.data.accessToken);
            const roles = payload.data.user.roles || [];
            localStorage.setItem('roles', JSON.stringify(roles));

            const searchParams = new URLSearchParams(location.search);
            const returnTo = searchParams.get('returnTo');

            sessionStorage.removeItem('answersSavedAfterLogin');

            if (roles.includes('admin') || roles.includes('super_admin')) {
                sessionStorage.removeItem('pendingOnboardingAnswers');
                navigate('/admin-dashboard', { replace: true });
                return;
            }

            if (payload.data.user.profileCompletionRequired && !options.skipProfileCompletion) {
                setPendingAuthPayload(payload);
                setProfileDob(payload.data.user.date_of_birth ? String(payload.data.user.date_of_birth).slice(0, 10) : '');
                setProfileGender(payload.data.user.gender || '');
                setProfileError('');
                setGoogleProfileStep(true);
                return;
            }

            if (returnTo === 'symptom-assessment') {
                try {
                    await savePendingOnboardingAnswers();
                } catch (saveErr) {
                    console.error('Failed to batch-save onboarding answers:', saveErr);
                } finally {
                    sessionStorage.removeItem('pendingOnboardingAnswers');
                }
                sessionStorage.setItem('returnToSymptomAssessment', 'true');
                navigate('/symptom-assessment', { replace: true });
                return;
            }

            sessionStorage.removeItem('pendingOnboardingAnswers');
            sessionStorage.setItem('assessmentPopupPostLogin', 'true');
            const from = location.state?.from;
            const targetPath = typeof from === 'string' ? from : from?.pathname;
            const isProtectedPath = targetPath && !['/signin', '/signup', '/'].includes(targetPath);
            if (isProtectedPath) {
                navigate(targetPath, { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
            return;
        }

        const errorMsg = payload?.message || 'Login failed.';
        setErrorMessage(errorMsg);
        setError(errorMsg);
        setSuccess('');
    };

    const handleProfileCompletionSubmit = async () => {
        if (!profileDob || !profileGender) {
            setProfileError('Date of birth and gender are required.');
            return;
        }

        const dobDate = new Date(profileDob);
        const today = new Date();
        if (Number.isNaN(dobDate.getTime()) || dobDate > today) {
            setProfileError('Please enter a valid past date of birth.');
            return;
        }

        setProfileSaving(true);
        setProfileError('');
        try {
            await axiosInstance.put('/users/profile', {
                personalInfo: {
                    date_of_birth: profileDob,
                    gender: profileGender,
                },
            });

            const completedPayload = {
                ...pendingAuthPayload,
                data: {
                    ...pendingAuthPayload.data,
                    user: {
                        ...pendingAuthPayload.data.user,
                        date_of_birth: profileDob,
                        gender: profileGender,
                        profileCompletionRequired: false,
                    },
                },
            };
            setGoogleProfileStep(false);
            setPendingAuthPayload(null);
            await handleAuthSuccess(completedPayload, { skipProfileCompletion: true });
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Could not save profile details. Please try again.';
            setProfileError(errorMsg);
        } finally {
            setProfileSaving(false);
        }
    };

    const handleGoogleLogin = useCallback(async (idToken) => {
        if (!idToken) {
            const msg = 'Google token missing. Please try again.';
            setErrorMessage(msg);
            setError(msg);
            return;
        }

        setGoogleLoading(true);
        setSuccess('');
        setError('');
        setErrorMessage('');

        try {
            const res = await axiosInstance.post('/auth/google', { idToken }, { withCredentials: true });
            await handleAuthSuccess(res.data);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Google login failed.';
            setErrorMessage(errorMsg);
            setError(errorMsg);
            setSuccess('');
        } finally {
            setGoogleLoading(false);
        }
    }, [setError, setSuccess]);

    useEffect(() => {
        if (!googleClientId || !googleButtonContainerRef.current) return undefined;

        const setupGoogle = () => {
            if (!window.google?.accounts?.id) return;
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: (response) => {
                    handleGoogleLogin(response?.credential);
                },
            });
            googleButtonContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleButtonContainerRef.current, {
                type: 'standard',
                shape: 'pill',
                size: 'large',
                text: 'continue_with',
                width: 320,
            });
        };

        if (window.google?.accounts?.id) {
            setupGoogle();
            return undefined;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = setupGoogle;
        document.body.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [googleClientId, handleGoogleLogin]);

    const validate = () => {
        if (!email || !password) {
            setErrorMessage('Email and password are required.');
            setError('Email and password are required.');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErrorMessage('Invalid email format.');
            setError('Invalid email format.');
            return false;
        }
        setErrorMessage('');
        setError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setSuccess('');
        setError('');
        setErrorMessage('');
        try {
            const res = await axiosInstance.post('/auth/login', {
                email,
                password,
            }, { withCredentials: true });

            await handleAuthSuccess(res.data);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Login failed.';
            setErrorMessage(errorMsg);
            setError(errorMsg);
            setSuccess('');
        } finally {
            setLoading(false);
        }
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
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
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
                    width: { xs: '100%', sm: 420 },
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
            >
                {googleProfileStep ? (
                    <Box>
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
                                Complete Profile
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Add the same required details used in manual signup
                            </Typography>
                        </Box>

                        <Alert severity="info" sx={{ mb: 2 }}>
                            Google provides your name and email, but not date of birth or gender. Add these two details to continue.
                        </Alert>
                        {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}

                        <TextField
                            fullWidth
                            label="Date of Birth"
                            type="date"
                            value={profileDob}
                            onChange={(e) => setProfileDob(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ mb: 2 }}
                        />

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Gender</InputLabel>
                            <Select
                                value={profileGender}
                                label="Gender"
                                onChange={(e) => setProfileGender(e.target.value)}
                            >
                                <MenuItem value="Male">Male</MenuItem>
                                <MenuItem value="Female">Female</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleProfileCompletionSubmit}
                            disabled={profileSaving}
                            sx={{
                                py: 1.5,
                                fontWeight: 700,
                                textTransform: 'none',
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            }}
                        >
                            {profileSaving ? 'Saving...' : 'Continue'}
                        </Button>
                    </Box>
                ) : (
                <>
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
                            Welcome Back
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sign in to manage your diabetes health journey
                        </Typography>
                    </Box>
                </motion.div>


                {/* Error Alert */}
                <AnimatePresence>
                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {errorMessage}
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <motion.div variants={itemVariants}>
                        <Box sx={{ position: 'relative', mb: 2 }}>
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
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.background.default, 0.8),
                                        },
                                        '&.Mui-focused': {
                                            backgroundColor: theme.palette.background.paper,
                                            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                                        }
                                    }
                                }}
                                InputLabelProps={{
                                    sx: { 
                                        fontWeight: 500,
                                    }
                                }}
                            />
                        </Box>
                    </motion.div>

                    {/* Password Field */}
                    <motion.div variants={itemVariants}>
                        <Box sx={{ position: 'relative', mb: 2 }}>
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
                                                sx={{ color: 'text.secondary' }}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: { 
                                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.background.default, 0.8),
                                        },
                                        '&.Mui-focused': {
                                            backgroundColor: theme.palette.background.paper,
                                            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                                        }
                                    }
                                }}
                                InputLabelProps={{
                                    sx: { fontWeight: 500 }
                                }}
                            />
                        </Box>
                    </motion.div>

                    {/* Remember Me & Forgot Password */}
                    <motion.div variants={itemVariants}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox 
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        sx={{ 
                                            '&.Mui-checked': {
                                                color: theme.palette.primary.main
                                            }
                                        }}
                                    />
                                }
                                label={
                                    <Typography variant="body2" fontWeight={500}>
                                        Remember me
                                    </Typography>
                                }
                            />
                            <Link
                                component={RouterLink}
                                to="/forgotpassword"
                                sx={{
                                    color: theme.palette.primary.main,
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                    fontSize: '0.875rem',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                    },
                                }}
                            >
                                Forgot password?
                            </Link>
                        </Box>
                    </motion.div>

                    {/* Submit Button */}
                    <motion.div variants={itemVariants}>
                        <Button
                            variant="contained"
                            fullWidth
                            type="submit"
                            disabled={loading}
                            sx={{
                                py: 1.5,
                                fontWeight: 600,
                                fontSize: '1rem',
                                textTransform: 'none',
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                                '&:hover': {
                                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.3s',
                            }}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </motion.div>
                </form>

                {!!googleClientId && (
                    <>
                        <Divider sx={{ my: 2 }}>or</Divider>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <Box ref={googleButtonContainerRef} />
                            {googleLoading && (
                                <Button startIcon={<GoogleIcon />} size="small" disabled>
                                    Signing in with Google...
                                </Button>
                            )}
                        </Box>
                    </>
                )}

                {/* Sign Up Link */}
                <motion.div variants={itemVariants}>
                    <Typography textAlign="center" variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
                        Don't have an account?{' '}
                        <Link
                            component={RouterLink}
                            to="/signup"
                            sx={{
                                color: theme.palette.primary.main,
                                fontWeight: 600,
                                textDecoration: 'none',
                                '&:hover': {
                                    textDecoration: 'underline',
                                },
                            }}
                        >
                            Sign up
                        </Link>
                    </Typography>
                </motion.div>
                </>
                )}
            </Paper>
        </motion.div>
    );
}
