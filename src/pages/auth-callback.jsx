import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';
import Loader from '../components/common/loader-component';
import { getAccessToken } from '../services/fyers-auth-service';
import { useAuth } from '../context/auth-context';

const AuthCallback = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { updateUserAfterLogin } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the auth_code from URL query params
        const searchParams = new URLSearchParams(location.search);
        const authCode = searchParams.get('auth_code');
        console.log("🚀 ~ handleAuthCallback ~ authCode:", authCode)
        
        if (!authCode) {
          throw new Error('Authorization code not found in URL');
        }

        // Get the secret key from environment variables
        const secretKey = import.meta.env.VITE_FYERS_SECRET_KEY;
        
        if (!secretKey) {
          throw new Error('Secret key not found in environment variables');
        }

        // Get access token using auth code and secret key
        const response = await getAccessToken(authCode, secretKey);
        console.log("🚀 ~ handleAuthCallback ~ response:", response)
        
        if (response && response.access_token) {
          // Update authentication context
          updateUserAfterLogin(response.access_token);
          
          // Redirect to dashboard
          setTimeout(() => {
            navigate('/dashboard');
          }, 3500);
        } else {
          throw new Error('Failed to get access token');
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [location.search, navigate, updateUserAfterLogin]);

  if (loading) {
    return <Loader message="Authenticating..." />;
  }

  if (error) {
    return (
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <Typography variant="body1">
            Authentication Error: {error}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please try logging in again.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
      <Alert severity="success" sx={{ maxWidth: 500 }}>
        <Typography variant="body1">
          Authentication successful! Redirecting to dashboard...
        </Typography>
      </Alert>
    </Box>
  );
};

export default AuthCallback;
