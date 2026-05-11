import { alpha, createTheme, responsiveFontSizes } from '@mui/material/styles';

const healthScale = {
  excellent: '#10B981',
  good: '#22C55E',
  moderate: '#F59E0B',
  concerning: '#F97316',
  critical: '#EF4444',
};

/** Body / UI copy — Inter stack (bundled + system fallbacks). */
const fontSans = '"Inter Variable", "Inter", "Roboto", "Helvetica", "Arial", sans-serif';
/** Marketing / display — Poppins with Inter fallback (loaded in `index.html`). */
const fontDisplay = `"Poppins", ${fontSans}`;

const typography = {
  fontFamily: fontSans,
  h1: { fontSize: '2.5rem', lineHeight: 1.2, fontWeight: 700 },
  h2: { fontSize: '2rem', lineHeight: 1.25, fontWeight: 700 },
  h3: { fontSize: '1.75rem', lineHeight: 1.3, fontWeight: 600 },
  h4: { fontSize: '1.5rem', lineHeight: 1.33, fontWeight: 600 },
  h5: { fontSize: '1.25rem', lineHeight: 1.4, fontWeight: 600 },
  h6: { fontSize: '1.125rem', lineHeight: 1.4, fontWeight: 600 },
  body1: { fontSize: '1rem', lineHeight: 1.6, fontWeight: 400 },
  body2: { fontSize: '0.875rem', lineHeight: 1.5, fontWeight: 400 },
  caption: { fontSize: '0.75rem', lineHeight: 1.4, fontWeight: 500 },
  button: { fontWeight: 600, textTransform: 'none' },
  /** Landing / hero-style kicker (green block) — use with responsive `fontSize` in `sx`. */
  marketingEyebrow: {
    fontFamily: fontDisplay,
    fontWeight: 700,
    fontSize: '1.75rem',
    lineHeight: 1.3,
    letterSpacing: '0.01em',
  },
  /** Landing / hero main title — use with responsive `fontSize` in `sx`. */
  marketingHeadline: {
    fontFamily: fontDisplay,
    fontWeight: 800,
    fontSize: '3rem',
    lineHeight: 1.14,
    letterSpacing: '-0.02em',
  },
};

const createBaseTheme = (mode) =>
  createTheme({
    spacing: 4,
    shape: {
      borderRadius: 12,
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
    typography,
    palette: {
      mode,
      primary: {
        main: '#6366F1',
        dark: '#4F46E5',
        light: '#EEF2FF',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#06B6D4',
        dark: '#0891B2',
        light: '#CFFAFE',
        contrastText: '#0F172A',
      },
      success: { main: '#10B981' },
      warning: { main: '#F59E0B' },
      error: { main: '#EF4444' },
      info: { main: '#3B82F6' },
      text:
        mode === 'light'
          ? { primary: '#111827', secondary: '#6B7280', disabled: '#9CA3AF' }
          : { primary: '#F9FAFB', secondary: '#CBD5E1', disabled: '#64748B' },
      background:
        mode === 'light'
          ? {
              default: '#FAFAFA',
              paper: '#FFFFFF',
              gradient: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
              card: '#FFFFFF',
              sidebar: '#FFFFFF',
              header: '#FFFFFF',
            }
          : {
              default: '#0B1220',
              paper: '#111827',
              gradient: 'linear-gradient(180deg, #0B1220 0%, #020617 100%)',
              card: '#111827',
              sidebar: '#111827',
              header: '#111827',
            },
      divider: mode === 'light' ? '#E5E7EB' : '#1F2937',
      border: mode === 'light' ? '#E5E7EB' : '#334155',
      shadow: mode === 'light' ? '0 4px 20px rgba(15, 23, 42, 0.06)' : '0 6px 24px rgba(0, 0, 0, 0.35)',
      health: healthScale,
      /** Diabetes TeleCare–inspired marketing chrome (navbar, gradients). */
      brandTelecare: {
        cyan: '#29ABE2',
        lime: '#7AC943',
        /** Floating marketing nav (logo circle + primary CTA): blue → cyan */
        navPillBlue: '#3B82F6',
        navPillGradient: 'linear-gradient(90deg, #3B82F6 0%, #29ABE2 100%)',
        topBarGradient: 'linear-gradient(90deg, #29ABE2 0%, #7AC943 100%)',
        ctaGradient: 'linear-gradient(90deg, #7AC943 0%, #29ABE2 100%)',
        onGradient: '#FFFFFF',
        navText: '#1A1A1A',
        navMuted: '#4B5563',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 12,
            minHeight: 44,
            transition: 'all 220ms ease',
            '&:focus-visible': {
              outline: `3px solid ${alpha(theme.palette.primary.main, 0.35)}`,
              outlineOffset: 2,
            },
          }),
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 16,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.shadow,
            transition: 'box-shadow 220ms ease, transform 220ms ease',
          }),
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 12,
            backgroundColor: alpha(theme.palette.background.paper, mode === 'light' ? 0.9 : 0.6),
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.divider,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.primary.main, 0.45),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
              borderColor: theme.palette.primary.main,
            },
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 600,
          },
        },
      },
    },
  });

export const createAppTheme = (mode) => responsiveFontSizes(createBaseTheme(mode));

