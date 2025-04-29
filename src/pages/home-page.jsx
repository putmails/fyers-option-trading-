import React, { useEffect } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/login-form';
import { useAuth } from '../context/auth-context';

const Home = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, navigate]);

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Welcome to Options Trading Platform
        </Typography>
        <Typography
          variant="subtitle1"
          align="center"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Login with your Fyers account to access advanced trading tools
        </Typography>

        <LoginForm />

        <Box sx={{ mt: 6 }}>
          <Typography variant="body2" align="center" color="text.secondary">
            This platform provides options trading analysis and execution
            capabilities. Please ensure you understand the risks involved in
            options trading before proceeding.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Home;
