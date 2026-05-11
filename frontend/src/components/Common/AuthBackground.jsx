import React from 'react';
import { Box, alpha } from '@mui/material';
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

const diabeticIcons = [
  { Icon: LocalHospitalIcon, size: 120 },
  { Icon: FavoriteIcon, size: 100 },
  { Icon: HealthAndSafetyIcon, size: 110 },
  { Icon: MonitorHeartIcon, size: 105 },
  { Icon: BloodtypeIcon, size: 95 },
  { Icon: MedicalServicesIcon, size: 115 },
  { Icon: HealingIcon, size: 100 },
  { Icon: LocalPharmacyIcon, size: 105 },
  { Icon: MedicationIcon, size: 110 },
  { Icon: ScienceIcon, size: 100 },
  { Icon: BiotechIcon, size: 95 },
];

export default function AuthBackground() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const freshPalette = ['#22D3EE', '#38BDF8', '#60A5FA', '#84CC16', '#A3E635'];

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Watermark Icons */}
      {diabeticIcons.map((item, index) => {
        const { Icon } = item;
        const positions = [
          { top: '10%', left: '5%', rotate: -15 },
          { top: '20%', right: '8%', rotate: 20 },
          { top: '35%', left: '3%', rotate: -10 },
          { top: '45%', right: '12%', rotate: 25 },
          { top: '60%', left: '7%', rotate: -20 },
          { top: '70%', right: '5%', rotate: 15 },
          { top: '80%', left: '10%', rotate: -25 },
          { top: '15%', left: '50%', rotate: 10 },
          { top: '50%', right: '50%', rotate: -15 },
          { top: '75%', left: '45%', rotate: 20 },
          { bottom: '10%', right: '15%', rotate: -10 },
        ];
        const pos = positions[index % positions.length];

        const freshColor = freshPalette[index % freshPalette.length];

        return (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              ...pos,
              fontSize: item.size,
              color: isDark
                ? alpha(freshColor, 0.2)
                : alpha(freshColor, 0.18),
              opacity: isDark ? 0.8 : 0.7, // Higher opacity for better visibility
              animation: `float ${15 + index * 2}s ease-in-out infinite`,
              animationDelay: `${index * 0.5}s`,
              '--rotate': `${pos.rotate}deg`,
            }}
          >
            <Icon 
              sx={{ 
                fontSize: 'inherit', 
                color: 'inherit',
              }} 
            />
          </Box>
        );
      })}

      {/* Additional decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '30%',
          left: '20%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: isDark
            ? `radial-gradient(circle, ${alpha('#22D3EE', 0.07)} 0%, transparent 70%)`
            : `radial-gradient(circle, ${alpha('#22D3EE', 0.04)} 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          right: '25%',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: isDark
            ? `radial-gradient(circle, ${alpha('#60A5FA', 0.07)} 0%, transparent 70%)`
            : `radial-gradient(circle, ${alpha('#60A5FA', 0.04)} 0%, transparent 70%)`,
          filter: 'blur(50px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: isDark
            ? `radial-gradient(circle, ${alpha('#84CC16', 0.06)} 0%, transparent 70%)`
            : `radial-gradient(circle, ${alpha('#84CC16', 0.035)} 0%, transparent 70%)`,
          filter: 'blur(35px)',
        }}
      />

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(var(--rotate, 0deg));
          }
          50% {
            transform: translateY(-20px) rotate(var(--rotate, 0deg));
          }
        }
      `}</style>
    </Box>
  );
}

