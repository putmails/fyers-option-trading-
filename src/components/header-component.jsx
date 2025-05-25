import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

const Header = () => {
  const { isLoggedIn, logout } = useAuth();

  return (
    <AppBar position="static" style={{width: '100%', backgroundColor: '#2E7D32'}}> 
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'white' }}
        >
          Fyers Trading Platform
        </Typography>
        <Box>
          {isLoggedIn ? (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to="/dashboard"
                sx={{ mx: 1 }}
              >
                Dashboard
              </Button>
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <Button color="inherit" component={RouterLink} to="/">
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
