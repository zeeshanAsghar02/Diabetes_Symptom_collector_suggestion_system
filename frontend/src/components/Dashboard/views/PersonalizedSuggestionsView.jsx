import React from 'react';
import { Box, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ChatIcon from '@mui/icons-material/Chat';
import FeatureCard from '../cards/FeatureCard';
import dashboardTheme from '../../../theme/dashboardTheme';

/**
 * Personalized Suggestions View - Displays feature cards for various health management tools
 * Shows 6 feature cards with locked/unlocked states based on profile completion
 */
const PersonalizedSuggestionsView = ({
  personalInfoCompletion = 0,
  setOpenCardModal,
}) => {
  const featureCards = [
    {
      id: 'personal-medical',
      title: 'Personal & Medical Information',
      description: 'Complete your health profile to unlock personalized recommendations and insights.',
      icon: PersonIcon,
      iconGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      buttonGradient: dashboardTheme.colors.primary.gradient,
      isLocked: false,
      completionPercentage: personalInfoCompletion,
    },
    {
      id: 'diet-plan',
      title: 'Nutrition & Diet Plan',
      description: 'AI-powered meal plans tailored to your diabetes management needs and regional preferences.',
      icon: RestaurantIcon,
      iconGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      buttonGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      isLocked: true,
    },
    {
      id: 'exercise-plan',
      title: 'Exercise Plan',
      description: 'Personalized workout routines designed for safe and effective diabetes management.',
      icon: FitnessCenterIcon,
      iconGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      buttonGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      isLocked: true,
    },
    {
      id: 'lifestyle-tips',
      title: 'Lifestyle Tips & Wellness',
      description: 'Evidence-based lifestyle guidance and wellness tips for better diabetes management.',
      icon: LightbulbIcon,
      iconGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      buttonGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      isLocked: true,
    },
    {
      id: 'pro-tips',
      title: 'Pro Tips',
      description: 'Expert advice and best practices for managing your health and wellness journey.',
      icon: EmojiEventsIcon,
      iconGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      buttonGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      isComingSoon: true,
    },
    {
      id: 'chat-assistant',
      title: 'AI Health Assistant',
      description: 'Chat with our intelligent AI assistant for personalized health guidance and support.',
      icon: ChatIcon,
      iconGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      buttonGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      isLocked: true,
    },
  ];

  return (
    <Box>
      {/* Section Header */}
      <Box 
        sx={{ 
          textAlign: 'center', 
          mb: 5,
          pt: 2,
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 800, 
            mb: 2,
            fontSize: { xs: '2rem', md: '2.5rem' },
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Personalized Health Management Suite
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            fontSize: '1.1rem', 
            lineHeight: 1.7,
            maxWidth: 800,
            mx: 'auto',
            color: '#5f6368',
          }}
        >
          Everything you need for accurate diabetes risk assessment and health management
        </Typography>
      </Box>

      {/* Feature Cards Grid */}
      <Box 
        sx={{
          display: 'grid',
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            lg: 'repeat(3, 1fr)' 
          },
          gap: 3,
          mb: 5,
        }}
      >
        {featureCards.map((card) => (
          <FeatureCard
            key={card.id}
            title={card.title}
            description={card.description}
            icon={card.icon}
            iconGradient={card.iconGradient}
            buttonGradient={card.buttonGradient}
            isLocked={card.isLocked}
            isComingSoon={card.isComingSoon}
            completionPercentage={card.completionPercentage}
            personalInfoCompletion={personalInfoCompletion}
            onClick={() => setOpenCardModal(card.id)}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PersonalizedSuggestionsView;
