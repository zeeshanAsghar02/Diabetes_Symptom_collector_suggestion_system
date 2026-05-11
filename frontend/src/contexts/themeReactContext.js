import { createContext } from 'react';

// Separated React context to keep ThemeContext.jsx exporting components only (fixes fast-refresh warning)
const ThemeReactContext = createContext();
export default ThemeReactContext;
