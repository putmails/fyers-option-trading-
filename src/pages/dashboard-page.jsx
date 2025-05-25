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
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import OptionDetails from '../components/Dashboard/option-details';
import Loader from '../components/common/loader-component';
import { calculatePutCallRatio } from '../utils/options-helper';
import OptionChain from '../components/Dashboard/OptionChain';
import SentimentSummary from '../components/Dashboard/sentiment-summary';

const Dashboard = () => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for options trading
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

  // Handle option chain data update
  const handleOptionChainDataUpdate = (data) => {
    setOptionChainData(data);
  };

  // Calculate PCR (Put-Call Ratio)
  const pcr = optionChainData ? calculatePutCallRatio(optionChainData) : null;

  // Mock account data
  // const accountData = {
  //   availableBalance: '50,000.00',
  //   usedMargin: '12,500.00',
  //   availableMargin: '37,500.00',
  //   totalPnL: '+1,250.00',
  // };

  // // Mock positions data
  // const positionsData = [
  //   {
  //     symbol: 'NIFTY 25APR 18200 CE',
  //     qty: 50,
  //     avgPrice: 100.25,
  //     ltp: 120.5,
  //     pnl: '+1,012.50',
  //   },
  //   {
  //     symbol: 'BANKNIFTY 25APR 44000 PE',
  //     qty: 25,
  //     avgPrice: 150.75,
  //     ltp: 140.25,
  //     pnl: '-262.50',
  //   },
  // ];

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
    <Container 
      maxWidth={false} 
      sx={{ 
        mt: 4, 
        mb: 4, 
        mx: 0,
        px: { xs: 1, sm: 2, md: 3 }, // Responsive padding
        width: '100%',
      }}
    >
      <Typography variant="h4" gutterBottom>
        Trading Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Trading Interface */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            {/* Sentiment Summary */}
            <SentimentSummary />
            {/* Option Chain Tab */}
            <Box>
              <Grid container spacing={0}>
                {/* Option Chain */}
                <Grid item xs={12} md={8}>
                  <OptionChain />
                </Grid>
                {/* Option Details */}
                <Grid
                  item
                  xs={12}
                  md={4}
                  sx={{ borderLeft: '1px solid #e0e0e0' }}
                >
                  <Box sx={{ p: 2, position: 'sticky', top: 0 }}>
                    {pcr && (
                      <Box
                        sx={{
                          mb: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Put-Call Ratio:
                        </Typography>
                        <Chip
                          label={pcr.toFixed(2)}
                          color={
                            pcr > 1
                              ? 'error'
                              : pcr < 0.5
                              ? 'success'
                              : 'warning'
                          }
                          size="small"
                        />
                      </Box>
                    )}

                    <OptionDetails
                    // option={selectedOption}
                    // underlying={underlyingAsset}
                    // expiryDate={selectedExpiryDate }
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
