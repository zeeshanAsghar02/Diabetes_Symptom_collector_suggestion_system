import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme } from '../../contexts/useThemeContext';

const ThemeToggle = ({ size = 'medium', showTooltip = true, sx = {} }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  const handleToggle = () => {
    toggleTheme();
  };

  const button = (
    <IconButton
      onClick={handleToggle}
      sx={{
        color: 'text.primary',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'scale(1.1)',
          backgroundColor: 'action.hover',
        },
        ...sx,
      }}
      size={size}
    >
      {isDarkMode ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
    </IconButton>
  );

  if (showTooltip) {
    return (
      <Tooltip 
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        placement="bottom"
        arrow
      >
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default ThemeToggle;
