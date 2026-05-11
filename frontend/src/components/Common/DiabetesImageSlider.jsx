import React, { useState, useEffect } from 'react';
import { Box, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import HealingIcon from '@mui/icons-material/Healing';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import MedicationIcon from '@mui/icons-material/Medication';
import ScienceIcon from '@mui/icons-material/Science';
import BiotechIcon from '@mui/icons-material/Biotech';

// High-quality diabetes and healthcare-related images - all 800x800 for consistency
const diabetesImages = [
  // Blood glucose meter and diabetes monitoring
  'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=800&fit=crop&auto=format&q=90',
  // Healthy nutrition for diabetes management
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=800&fit=crop&auto=format&q=90',
  // Healthcare professional consultation
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=800&fit=crop&auto=format&q=90',
  // Medical technology and devices
  'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&h=800&fit=crop&auto=format&q=90',
  // Healthy lifestyle and wellness
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=800&fit=crop&auto=format&q=90',
  // Modern healthcare and medical care
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=800&fit=crop&auto=format&q=90',
];

// Medical icons as SVG-like components
const medicalIcons = [
  { Icon: LocalHospitalIcon, color: 'primary' },
  { Icon: FavoriteIcon, color: 'error' },
  { Icon: HealthAndSafetyIcon, color: 'success' },
  { Icon: MonitorHeartIcon, color: 'primary' },
  { Icon: BloodtypeIcon, color: 'error' },
  { Icon: MedicalServicesIcon, color: 'info' },
  { Icon: HealingIcon, color: 'success' },
  { Icon: LocalPharmacyIcon, color: 'primary' },
  { Icon: MedicationIcon, color: 'info' },
  { Icon: ScienceIcon, color: 'warning' },
  { Icon: BiotechIcon, color: 'success' },
];

// Combine images and icons, alternating them
const sliderItems = [
  ...diabetesImages.map((url, idx) => ({ type: 'image', content: url, id: `img-${idx}` })),
  ...medicalIcons.map((item, idx) => ({ type: 'icon', content: item, id: `icon-${idx}` })),
];

const SLIDE_DURATION = 4000; // 4 seconds per slide

export default function DiabetesImageSlider() {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliderItems.length);
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, []);

  const currentItem = sliderItems[currentIndex];
  const IconSlide =
    currentItem.type === 'icon' ? currentItem.content.Icon : null;

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 500 },
        height: { xs: 300, md: 400 },
        maxWidth: '100%',
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: isDark
          ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`
          : `linear-gradient(135deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#f8fafc', 0.9)} 100%)`,
        boxShadow: isDark
          ? `0 8px 32px ${alpha(theme.palette.common.black, 0.3)}`
          : `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {currentItem.type === 'image' ? (
            <Box
              component="img"
              src={currentItem.content}
              alt="Diabetes health"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : IconSlide ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                p: 4,
              }}
            >
              <IconSlide
                sx={{
                  fontSize: 200,
                  color: `${currentItem.content.color}.main`,
                  opacity: 0.9,
                }}
              />
            </Box>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Slide indicators */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1,
          zIndex: 2,
        }}
      >
        {sliderItems.map((_, index) => (
          <Box
            key={index}
            onClick={() => setCurrentIndex(index)}
            sx={{
              width: currentIndex === index ? 24 : 8,
              height: 8,
              borderRadius: 1,
              bgcolor: currentIndex === index
                ? theme.palette.primary.main
                : alpha(theme.palette.common.white, 0.5),
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: currentIndex === index
                  ? theme.palette.primary.dark
                  : alpha(theme.palette.common.white, 0.7),
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

