import React from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Construction as ConstructionIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

const ComingSoonPage = () => {
    const navigate = useNavigate();
    const { section } = useParams();

    const sectionTitles = {
        'diet-plan': 'Diet Plan',
        'exercise-plan': 'Exercise Plan',
        'lifestyle-tips': 'Lifestyle Tips',
        'pro-tips': 'Pro Tips',
        'chat-assistant': 'Chat Assistant',
        'future': 'Additional Resources',
    };

    const sectionDescriptions = {
        'diet-plan': 'Get personalized nutrition plans and meal recommendations based on your health profile.',
        'exercise-plan': 'Access customized fitness routines and workout plans tailored to your needs.',
        'lifestyle-tips': 'Discover daily habits and wellness tips to improve your overall health.',
        'pro-tips': 'Learn expert advice and best practices from health professionals.',
        'chat-assistant': 'Chat with our AI assistant to get instant answers to your health questions.',
        'future': 'More exciting modules and features are coming soon.',
    };

    const title = sectionTitles[section] || 'Module';
    const description = sectionDescriptions[section] || 'This module is coming soon.';

    const handleBack = () => {
        navigate('/personalized-suggestions/dashboard', { replace: true });
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', py: 4 }}>
            <Container maxWidth="md">
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 6 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBack}
                        sx={{ mr: 2, textTransform: 'none' }}
                    >
                        Back
                    </Button>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main' }}>
                        {title}
                    </Typography>
                </Box>

                {/* Coming Soon Card */}
                <Card
                    elevation={4}
                    sx={{
                        borderRadius: 3,
                        textAlign: 'center',
                        py: 8,
                        px: 4,
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #fce7f3 100%)',
                        border: '2px solid #dbeafe',
                    }}
                >
                    <CardContent>
                        {/* Icon */}
                        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                            <ConstructionIcon
                                sx={{
                                    fontSize: 80,
                                    color: '#f59e0b',
                                    opacity: 0.8,
                                }}
                            />
                        </Box>

                        {/* Title */}
                        <Typography
                            variant="h4"
                            fontWeight="bold"
                            gutterBottom
                            sx={{
                                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                mb: 2,
                            }}
                        >
                            {title} Coming Soon!
                        </Typography>

                        {/* Description */}
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ mb: 4, fontSize: '1.1rem', maxWidth: '500px', mx: 'auto' }}
                        >
                            {description}
                        </Typography>

                        {/* Additional Info */}
                        <Box
                            sx={{
                                bgcolor: '#fff',
                                borderRadius: 2,
                                p: 3,
                                mb: 4,
                                border: '1px solid #f3e8ff',
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                We're working hard to bring you this feature. Stay tuned!
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Check back soon to access this module. In the meantime, you can explore other available sections.
                            </Typography>
                        </Box>

                        {/* CTA Button */}
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleBack}
                            sx={{
                                textTransform: 'none',
                                fontSize: '1rem',
                                px: 4,
                                py: 1.5,
                                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                            }}
                        >
                            Explore Other Modules
                        </Button>
                    </CardContent>
                </Card>

                {/* Footer Info */}
                <Box sx={{ mt: 6, p: 3, bgcolor: '#fff', borderRadius: 2, textAlign: 'center', border: '1px solid #e5e7eb' }}>
                    <Typography variant="body2" color="text.secondary">
                        📧 Want to be notified when this module launches? Stay connected for updates!
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default ComingSoonPage;
