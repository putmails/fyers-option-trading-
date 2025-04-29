import React, { useEffect } from 'react';
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
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import OptionChain from '../components/Dashboard/option-chain';

const Dashboard = () => {
  // eslint-disable-next-line no-unused-vars
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = React.useState(0);

  // Redirect to home if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
                <Tab label="Orders" />
              </Tabs>
            </Box>
            <Box sx={{ p: 0 }}>
              {tabValue === 0 && (
                <OptionChain />
              )}
              {tabValue === 1 && (
                <Box p={2}>
                  <Typography>Trading form would go here</Typography>
                </Box>
              )}
              {tabValue === 2 && (
                <Box p={2}>
                  <Typography>Orders list would go here</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;