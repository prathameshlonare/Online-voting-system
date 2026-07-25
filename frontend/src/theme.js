import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1565C0',
      light: '#5E92F3',
      dark: '#003C8F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#C2185B',
      light: '#FA5788',
      dark: '#8B0032',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#2E7D32',
      light: '#60AD5E',
      dark: '#005005',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#ED6C02',
      light: '#FF9D3F',
      dark: '#B34F00',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D32F2F',
      light: '#FF6659',
      dark: '#9A0007',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#0288D1',
      light: '#5BB9F4',
      dark: '#005B9F',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F0F2F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A2E',
      secondary: '#4A4A68',
    },
    divider: '#E0E0E0',
  },
  typography: {
    fontFamily: "'Outfit', 'Poppins', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.35,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 4px 8px rgba(0,0,0,0.08)',
    '0px 6px 12px rgba(0,0,0,0.1)',
    '0px 8px 16px rgba(0,0,0,0.12)',
    '0px 10px 24px rgba(0,0,0,0.14)',
    '0px 12px 28px rgba(0,0,0,0.15)',
    '0px 14px 32px rgba(0,0,0,0.16)',
    '0px 16px 36px rgba(0,0,0,0.17)',
    '0px 18px 40px rgba(0,0,0,0.18)',
    '0px 20px 44px rgba(0,0,0,0.19)',
    '0px 22px 48px rgba(0,0,0,0.2)',
    '0px 24px 52px rgba(0,0,0,0.21)',
    '0px 26px 56px rgba(0,0,0,0.22)',
    '0px 28px 60px rgba(0,0,0,0.23)',
    '0px 30px 64px rgba(0,0,0,0.24)',
    '0px 32px 68px rgba(0,0,0,0.25)',
    '0px 34px 72px rgba(0,0,0,0.26)',
    '0px 36px 76px rgba(0,0,0,0.27)',
    '0px 38px 80px rgba(0,0,0,0.28)',
    '0px 40px 84px rgba(0,0,0,0.29)',
    '0px 42px 88px rgba(0,0,0,0.3)',
    '0px 44px 92px rgba(0,0,0,0.31)',
    '0px 46px 96px rgba(0,0,0,0.32)',
    '0px 48px 100px rgba(0,0,0,0.33)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: '44px',
          borderRadius: '8px',
          padding: '10px 24px',
          fontSize: '0.95rem',
        },
        contained: {
          boxShadow: '0px 2px 6px rgba(0,0,0,0.12)',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0,0,0,0.18)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: '48px',
          fontWeight: 600,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '12px',
        },
      },
    },
  },
});

export default theme;
