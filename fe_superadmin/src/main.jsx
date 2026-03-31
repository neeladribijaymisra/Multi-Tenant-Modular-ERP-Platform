import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    secondary: { main: '#0f766e' },
    background: { default: '#f4f7fb', paper: '#ffffff' },
    text: {
      primary: '#14213d',
      secondary: '#516074',
    },
  },
  typography: { fontFamily: 'Sora, sans-serif' },
  shape: { borderRadius: 18 },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
