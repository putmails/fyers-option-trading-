import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './context/auth-context';
import Header from './components/header-component';
import Home from './pages/home-page';
import AuthCallback from './pages/auth-callback';
import Dashboard from './pages/dashboard-page';
import NotFound from './pages/not-found-page';

// Create a theme instance with better color palette for trading platform
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Green - representing finance/trading
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    secondary: {
      main: '#0277BD', // Blue
      light: '#039BE5',
      dark: '#01579B',
    },
    success: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    error: {
      main: '#C62828',
      light: '#EF5350',
      dark: '#B71C1C',
    },
    warning: {
      main: '#FF8F00',
      light: '#FFB74D',
      dark: '#E65100',
    },
    info: {
      main: '#0277BD',
      light: '#29B6F6',
      dark: '#01579B',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 'bold',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 'medium',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/callback" element={<AuthCallback />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
