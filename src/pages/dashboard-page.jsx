/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Tabs, 
  Tab,
  Card,
  CardContent,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import OptionChain from '../components/Dashboard/option-chain';
import OptionDetails from '../components/Dashboard/option-details';
import OptionAnalysis from '../components/Dashboard/option-analysis';
import TradingForm from '../components/Dashboard/trading-form';
import Loader from '../components/common/loader-component';
import { calculatePutCallRatio } from '../utils/options-helper';

const Dashboard = () => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for options trading
  const [selectedOption, setSelectedOption] = useState(null);
  const [underlyingAsset, setUnderlyingAsset] = useState(null);
  const [optionChainData, setOptionChainData] = useState(null);
  const [selectedExpiryDate, setSelectedExpiryDate] = useState(null);

  // Redirect to home if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    } else {
      // Simulate loading data
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  }, [isLoggedIn, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle option selection from the option chain
  const handleOptionSelect = (option, underlying, expiryDate) => {
    setSelectedOption(option);
    setUnderlyingAsset(underlying);
    setSelectedExpiryDate(expiryDate);
  };

  // Handle option chain data update
  const handleOptionChainDataUpdate = (data) => {
    setOptionChainData(data);
  };

  // Calculate PCR (Put-Call Ratio)
  const pcr = optionChainData ? calculatePutCallRatio(optionChainData) : null;

  // Mock account data
  const accountData = {
    availableBalance: '50,000.00',
    usedMargin: '12,500.00',
    availableMargin: '37,500.00',
    totalPnL: '+1,250.00'
  };

  // Mock positions data
  const positionsData = [
    { symbol: 'NIFTY 25APR 18200 CE', qty: 50, avgPrice: 100.25, ltp: 120.50, pnl: '+1,012.50' },
    { symbol: 'BANKNIFTY 25APR 44000 PE', qty: 25, avgPrice: 150.75, ltp: 140.25, pnl: '-262.50' }
  ];

  if (loading) {
    return <Loader message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Trading Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Account Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Account Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Available Balance:</Typography>
              <Typography variant="body1">₹{accountData.availableBalance}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Used Margin:</Typography>
              <Typography variant="body1">₹{accountData.usedMargin}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Available Margin:</Typography>
              <Typography variant="body1">₹{accountData.availableMargin}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Total P&L:</Typography>
              <Typography 
                variant="body1" 
                color={accountData.totalPnL.startsWith('+') ? 'success.main' : 'error.main'}
                fontWeight="bold"
              >
                ₹{accountData.totalPnL}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Open Positions */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Open Positions
            </Typography>
            {positionsData.map((position, index) => (
              <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Grid container alignItems="center">
                    <Grid item xs={5}>
                      <Typography variant="body2" fontWeight="medium">
                        {position.symbol}
                      </Typography>
                    </Grid>
                    <Grid item xs={1}>
                      <Typography variant="body2">
                        {position.qty}
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2">
                        ₹{position.avgPrice}
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2">
                        ₹{position.ltp}
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography 
                        variant="body2" 
                        color={position.pnl.startsWith('+') ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        ₹{position.pnl}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>

        {/* Trading Interface */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="trading tabs"
                variant="fullWidth"
              >
                <Tab label="Option Chain" />
                <Tab label="Trade" />
                <Tab label="Analysis" />
                <Tab label="Orders" />
              </Tabs>
            </Box>
            
            {/* Option Chain Tab */}
            {tabValue === 0 && (
              <Box>
                <Grid container spacing={0}>
                  {/* Option Chain */}
                  <Grid item xs={12} md={8}>
                    <OptionChain 
                      onOptionSelect={handleOptionSelect}
                      onDataUpdate={handleOptionChainDataUpdate}
                    />
                  </Grid>
                  
                  {/* Option Details */}
                  <Grid item xs={12} md={4} sx={{ borderLeft: '1px solid #e0e0e0' }}>
                    <Box sx={{ p: 2, position: 'sticky', top: 0 }}>
                      {pcr && (
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Put-Call Ratio:
                          </Typography>
                          <Chip 
                            label={pcr.toFixed(2)} 
                            color={pcr > 1 ? 'error' : pcr < 0.5 ? 'success' : 'warning'} 
                            size="small"
                          />
                        </Box>
                      )}
                      
                      <OptionDetails 
                        option={selectedOption} 
                        underlying={underlyingAsset}
                        expiryDate={selectedExpiryDate}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Trade Tab */}
            {tabValue === 1 && (
              <Box p={2}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TradingForm 
                      selectedOption={selectedOption}
                      underlying={underlyingAsset}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <OptionDetails 
                      option={selectedOption} 
                      underlying={underlyingAsset}
                      expiryDate={selectedExpiryDate}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Analysis Tab */}
            {tabValue === 2 && (
              <Box p={2}>
                {selectedOption ? (
                  <OptionAnalysis 
                    option={selectedOption}
                    underlying={underlyingAsset}
                    expiryDate={selectedExpiryDate}
                  />
                ) : (
                  <Alert severity="info">
                    Please select an option from the Option Chain tab to analyze
                  </Alert>
                )}
              </Box>
            )}
            
            {/* Orders Tab */}
            {tabValue === 3 && (
              <Box p={2}>
                <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
                  No open orders
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;