import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    CircularProgress,
    MenuItem,
    Select,
    FormControl,
    Stack,
    Box,
    Paper,
    Divider,
    IconButton,
    Fade
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import { toast } from 'react-toastify';
import { fetchAllSettings, updateSetting } from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import { DATE_FORMAT_OPTIONS, formatDate } from '../utils/dateFormatter';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState([]);
    const [formData, setFormData] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const { refreshSettings } = useSettings();


    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await fetchAllSettings();
            
            console.log('Settings API Response:', response);
            
            if (response.success) {
                const settingsData = response.data;
                setSettings(settingsData);
                
                // Initialize form data with current values from single document
                setFormData({
                    site_title: settingsData.site_title || '',
                    site_description: settingsData.site_description || '',
                    contact_email: settingsData.contact_email || '',
                    contact_phone: settingsData.contact_phone || '',
                    admin_email: settingsData.admin_email || '',
                    date_format: settingsData.date_format || 'DD MMMM, YYYY'
                });
                setHasChanges(false);
            } else {
                console.error('Settings API returned success=false:', response);
                toast.error(response.message || 'Failed to load settings');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            console.error('Error response:', error.response);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to load settings';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            [key]: value
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            
            // Send bulk update with all form data
            await updateSetting('bulk', formData);
            
            toast.success('Settings saved successfully!');
            setHasChanges(false);
            await loadSettings();
            await refreshSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        // Reset form data to original values from settings object
        setFormData({
            site_title: settings.site_title || '',
            site_description: settings.site_description || '',
            contact_email: settings.contact_email || '',
            contact_phone: settings.contact_phone || '',
            admin_email: settings.admin_email || '',
            date_format: settings.date_format || 'DD MMMM, YYYY'
        });
        setHasChanges(false);
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h5" fontWeight={600} color="text.primary">
                    Settings
                </Typography>
                <IconButton onClick={loadSettings} disabled={saving} size="small">
                    <RefreshIcon />
                </IconButton>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Manage your application settings
            </Typography>



            {/* General Settings Tab */}
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                    {/* Site Title */}
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 2.5, '&:hover': { bgcolor: 'action.hover' } }}>
                        <Box sx={{ flex: '0 0 200px', pr: 3 }}>
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                                Site Title
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                The name of your website
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                value={formData['site_title'] || ''}
                                onChange={(e) => handleChange('site_title', e.target.value)}
                                disabled={saving}
                                placeholder="DiabetesCare"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'background.paper',
                                        '&:hover': { bgcolor: 'background.paper' }
                                    }
                                }}
                            />
                        </Box>
                    </Box>
                    
                    <Divider />

                    {/* Site Description */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2.5, '&:hover': { bgcolor: 'action.hover' } }}>
                        <Box sx={{ flex: '0 0 200px', pr: 3, pt: 0.5 }}>
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                                Description
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Brief description of your site
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                multiline
                                rows={3}
                                value={formData['site_description'] || ''}
                                onChange={(e) => handleChange('site_description', e.target.value)}
                                disabled={saving}
                                placeholder="Comprehensive diabetes management platform"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'background.paper',
                                        '&:hover': { bgcolor: 'background.paper' }
                                    }
                                }}
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Contact Email */}
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 2.5, '&:hover': { bgcolor: 'action.hover' } }}>
                        <Box sx={{ flex: '0 0 200px', pr: 3 }}>
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                                Contact Email
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Public support email
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                type="email"
                                value={formData['contact_email'] || ''}
                                onChange={(e) => handleChange('contact_email', e.target.value)}
                                disabled={saving}
                                placeholder="support@diabetescare.com"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'background.paper',
                                        '&:hover': { bgcolor: 'background.paper' }
                                    }
                                }}
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Contact Phone */}
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 2.5, '&:hover': { bgcolor: 'action.hover' } }}>
                        <Box sx={{ flex: '0 0 200px', pr: 3 }}>
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                                Contact Phone
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Public support phone number
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                value={formData['contact_phone'] || ''}
                                onChange={(e) => handleChange('contact_phone', e.target.value)}
                                disabled={saving}
                                placeholder="+92 323 300 4420"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'background.paper',
                                        '&:hover': { bgcolor: 'background.paper' }
                                    }
                                }}
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Admin Email */}
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 2.5, '&:hover': { bgcolor: 'action.hover' } }}>
                        <Box sx={{ flex: '0 0 200px', pr: 3 }}>
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                                Admin Email
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Administrator notifications
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                type="email"
                                value={formData['admin_email'] || ''}
                                onChange={(e) => handleChange('admin_email', e.target.value)}
                                disabled={saving}
                                placeholder="admin@diabetescare.com"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'background.paper',
                                        '&:hover': { bgcolor: 'background.paper' }
                                    }
                                }}
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Date Format */}
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 2.5, '&:hover': { bgcolor: 'action.hover' } }}>
                        <Box sx={{ flex: '0 0 200px', pr: 3 }}>
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                                Date Format
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {formatDate(new Date(), formData['date_format'] || 'DD MMMM, YYYY')}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={formData['date_format'] || 'DD MMMM, YYYY'}
                                    onChange={(e) => handleChange('date_format', e.target.value)}
                                    disabled={saving}
                                    sx={{
                                        bgcolor: 'background.paper',
                                        '&:hover': { bgcolor: 'background.paper' }
                                    }}
                                >
                                    {DATE_FORMAT_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.example}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </Paper>

            <Fade in={hasChanges}>
                <Paper
                    elevation={4}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        px: 3,
                        py: 1.5,
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        zIndex: 1000,
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        You have unsaved changes
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleReset}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={saving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <SaveIcon />}
                            onClick={handleSave}
                            disabled={saving}
                            disableElevation
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Stack>
                </Paper>
            </Fade>
        </Container>
    );
};

export default Settings;
