import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0f766e',
      light: '#14b8a6',
      dark: '#115e59',
    },
    success: {
      main: '#10b981',
      light: '#6ee7b7',
      dark: '#065f46',
    },
    warning: {
      main: '#f59e0b',
      light: '#fcd34d',
      dark: '#92400e',
    },
    error: {
      main: '#ef4444',
      light: '#fca5a5',
      dark: '#7f1d1d',
    },
    background: {
      default: '#eef2f7',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: { fontFamily: '"Manrope", sans-serif', fontWeight: 800 },
    h2: { fontFamily: '"Manrope", sans-serif', fontWeight: 800 },
    h3: { fontFamily: '"Manrope", sans-serif', fontWeight: 800 },
    h4: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
    button: { fontFamily: '"Inter", sans-serif', fontWeight: 700, textTransform: 'none' },
  },
  shape: {
    borderRadius: 18,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          padding: '10px 20px',
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 10px 25px rgba(15,23,42,0.12)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '28px',
          boxShadow: '0 20px 45px rgba(15,23,42,0.08)',
          border: '1px solid rgba(226,232,240,0.9)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '18px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: '999px', fontWeight: 700 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#f8fafc',
            fontWeight: 800,
            color: '#94a3b8',
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.8rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          },
        },
      },
    },
  },
});

export default theme;
