import React from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  CardActions,
  Container
} from '@mui/material';
import { generateAuthCodeUrl } from '../services/fyers-auth-service';

const LoginForm = () => {
  const handleLogin = () => {
    const authUrl = generateAuthCodeUrl();
    window.location.href = authUrl;
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Card sx={{ width: '100%', boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h5" component="div" gutterBottom align="center">
              Login to Your Trading Account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} align="center">
              Connect with your Fyers account to access the trading dashboard
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <img 
                src="https://assets.fyers.in/images/logo.svg" 
                alt="Fyers Logo" 
                style={{ height: '40px' }}
              />
            </Box>
          </CardContent>
          <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={handleLogin}
            >
              Login with Fyers
            </Button>
          </CardActions>
        </Card>
      </Box>
    </Container>
  );
};

export default LoginForm;
