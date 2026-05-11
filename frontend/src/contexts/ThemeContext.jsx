import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline, GlobalStyles } from '@mui/material';
import ThemeReactContext from './themeReactContext';
import { createAppTheme } from '../theme/index';

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const setTheme = (mode) => {
    setIsDarkMode(mode === 'dark');
  };

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const theme = useMemo(
    () => createAppTheme(isDarkMode ? 'dark' : 'light'),
    [isDarkMode]
  );

  const value = {
    isDarkMode,
    toggleTheme,
    setTheme,
    theme,
  };

  return (
    <ThemeReactContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={(t) => ({
            html: {
              backgroundColor: t.palette.background.default,
            },
            'html, body': {
              scrollbarWidth: 'thin',
              scrollbarColor:
                t.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.28) transparent'
                  : 'rgba(0,0,0,0.28) transparent',
            },
            '::-webkit-scrollbar': {
              width: '10px',
              height: '10px',
            },
            '::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '::-webkit-scrollbar-thumb': {
              backgroundColor:
                t.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.22)'
                  : 'rgba(0,0,0,0.22)',
              borderRadius: '8px',
              border:
                t.palette.mode === 'dark' ? '2px solid #0a0a0a' : '2px solid #ffffff',
            },
            '::-webkit-scrollbar-thumb:hover': {
              backgroundColor:
                t.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.35)'
                  : 'rgba(0,0,0,0.35)',
            },
            // Ensure all MUI form inputs/selects expand to available width
            '.MuiFormControl-root, .MuiTextField-root, .MuiAutocomplete-root, .MuiSelect-root, .MuiOutlinedInput-root, .MuiInputBase-root': {
              width: '100% !important',
              minWidth: 0,
            },
          })}
        />
        {children}
      </MuiThemeProvider>
    </ThemeReactContext.Provider>
  );
};

// Note: useTheme hook moved to separate file to avoid fast-refresh warning
