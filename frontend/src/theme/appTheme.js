import { createTheme } from "@mui/material/styles";

const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f766e",
      light: "#ccfbf1",
      dark: "#115e59",
    },
    secondary: {
      main: "#1d4ed8",
    },
    background: {
      default: "#f4f7f4",
      paper: "#ffffff",
    },
    text: {
      primary: "#102a26",
      secondary: "#47635d",
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.04em",
    },
    h2: {
      fontWeight: 800,
      letterSpacing: "-0.03em",
    },
    h3: {
      fontWeight: 700,
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 18,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

export default appTheme;
