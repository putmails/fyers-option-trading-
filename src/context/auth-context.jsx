import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  isAuthenticated,
  logout,
  getStoredAccessToken,
} from '../services/fyers-auth-service';

// Create context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        setUser({
          accessToken: getStoredAccessToken(),
          isLoggedIn: true,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function - updated by token acquisition flow elsewhere
  const updateUserAfterLogin = (accessToken) => {
    setUser({
      accessToken,
      isLoggedIn: true,
    });
  };

  // Logout function
  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/');
  };

  // Context value
  const value = {
    user,
    isLoggedIn: !!user?.isLoggedIn,
    loading,
    updateUserAfterLogin,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
