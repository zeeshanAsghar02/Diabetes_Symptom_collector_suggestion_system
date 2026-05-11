import { useContext } from 'react';
import ThemeReactContext from './themeReactContext';

export const useTheme = () => {
  const context = useContext(ThemeReactContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default useTheme;
