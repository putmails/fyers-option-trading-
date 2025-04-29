import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Slider,
  Divider,
  InputAdornment,
  Alert,
  Grid,
  Stack,
  Switch,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
// import TrendingUpIcon from '@mui/icons-material/TrendingUp';
// import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CallMadeIcon from '@mui/icons-material/CallMade';
import CallReceivedIcon from '@mui/icons-material/CallReceived';

// eslint-disable-next-line no-unused-vars
const TradingForm = ({ selectedOption, underlying }) => {
  // State for form
  const [orderType, setOrderType] = useState('market');
  const [buySell, setBuySell] = useState('buy');
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [status, setStatus] = useState(null);

  // Calculate order value
  const calculateOrderValue = () => {
    if (!selectedOption) return 0;

    const price =
      orderType === 'market'
        ? selectedOption.ltp
        : parseFloat(limitPrice) || selectedOption.ltp;

    return price * quantity;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // In a real app, this would call an API to place the order
    setStatus({
      success: true,
      message: `${buySell === 'buy' ? 'Bought' : 'Sold'} ${quantity} ${selectedOption?.symbol || ''} at ${orderType === 'market' ? 'market price' : `₹${limitPrice}`}`,
    });

    // Reset form after successful submission
    setTimeout(() => {
      setStatus(null);
    }, 3000);
  };

  // Handle order type change
  const handleOrderTypeChange = (event, newOrderType) => {
    if (newOrderType !== null) {
      setOrderType(newOrderType);
    }
  };

  // Handle buy/sell change
  const handleBuySellChange = (event, newBuySell) => {
    if (newBuySell !== null) {
      setBuySell(newBuySell);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (event) => {
    const value = parseInt(event.target.value, 10);
    setQuantity(isNaN(value) ? 1 : Math.max(1, value));
  };

  // Handle quantity increment/decrement
  const handleQuantityIncrement = (increment) => {
    setQuantity((prev) => Math.max(1, prev + increment));
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{ p: 3, height: '100%' }}
    >
      <Typography variant="h6" gutterBottom>
        Place Order
      </Typography>

      {!selectedOption ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Select an option from the chain to place an order
        </Alert>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1">{selectedOption.symbol}</Typography>
            <Typography variant="body2" color="text.secondary">
              Current Price: ₹
              {selectedOption.ltp?.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Buy/Sell Toggle */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Transaction Type
            </Typography>
            <ToggleButtonGroup
              value={buySell}
              exclusive
              onChange={handleBuySellChange}
              aria-label="buy or sell"
              fullWidth
            >
              <ToggleButton
                value="buy"
                aria-label="buy"
                sx={{
                  py: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'success.light',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'success.main',
                    },
                  },
                }}
              >
                <CallMadeIcon sx={{ mr: 1 }} />
                Buy
              </ToggleButton>
              <ToggleButton
                value="sell"
                aria-label="sell"
                sx={{
                  py: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'error.light',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'error.main',
                    },
                  },
                }}
              >
                <CallReceivedIcon sx={{ mr: 1 }} />
                Sell
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Quantity */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Quantity
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleQuantityIncrement(-1)}
                disabled={quantity <= 1}
                sx={{ minWidth: '36px' }}
              >
                -
              </Button>
              <TextField
                value={quantity}
                onChange={handleQuantityChange}
                variant="outlined"
                size="small"
                inputProps={{ min: 1, style: { textAlign: 'center' } }}
                sx={{ mx: 1, width: '100%' }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleQuantityIncrement(1)}
                sx={{ minWidth: '36px' }}
              >
                +
              </Button>
            </Box>
          </Box>

          {/* Order Type Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Order Type
            </Typography>
            <ToggleButtonGroup
              value={orderType}
              exclusive
              onChange={handleOrderTypeChange}
              aria-label="order type"
              fullWidth
            >
              <ToggleButton value="market" aria-label="market order">
                Market
              </ToggleButton>
              <ToggleButton value="limit" aria-label="limit order">
                Limit
              </ToggleButton>
              <ToggleButton value="sl" aria-label="stop loss order">
                SL
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Price fields based on order type */}
          {orderType === 'limit' && (
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Limit Price"
                variant="outlined"
                fullWidth
                size="small"
                required
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
              />
            </Box>
          )}

          {orderType === 'sl' && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <TextField
                  label="Trigger Price"
                  variant="outlined"
                  fullWidth
                  size="small"
                  required
                  value={triggerPrice}
                  onChange={(e) => setTriggerPrice(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Limit Price"
                  variant="outlined"
                  fullWidth
                  size="small"
                  required
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          )}

          {/* Advanced Options */}
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2">Advanced Options</Typography>
            <Switch
              checked={isAdvanced}
              onChange={(e) => setIsAdvanced(e.target.checked)}
              inputProps={{ 'aria-label': 'Toggle advanced options' }}
            />
          </Box>

          {isAdvanced && (
            <Box sx={{ mb: 3 }}>
              <FormControl component="fieldset" size="small">
                <FormLabel component="legend">Order Validity</FormLabel>
                <RadioGroup row defaultValue="day">
                  <FormControlLabel
                    value="day"
                    control={<Radio size="small" />}
                    label="Day"
                  />
                  <FormControlLabel
                    value="ioc"
                    control={<Radio size="small" />}
                    label="IOC"
                  />
                </RadioGroup>
              </FormControl>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Order Summary */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Order Summary
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Quantity:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {quantity}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Price:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" align="right">
                  {orderType === 'market'
                    ? 'Market Price'
                    : `₹${limitPrice || selectedOption.ltp?.toFixed(2) || '0.00'}`}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Value:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" align="right" fontWeight="bold">
                  ₹
                  {calculateOrderValue().toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            color={buySell === 'buy' ? 'success' : 'error'}
            sx={{ mt: 2 }}
          >
            {buySell === 'buy' ? 'Buy' : 'Sell'} {selectedOption.option_type}
          </Button>

          {/* Status Message */}
          {status && (
            <Alert
              severity={status.success ? 'success' : 'error'}
              sx={{ mt: 2 }}
              onClose={() => setStatus(null)}
            >
              {status.message}
            </Alert>
          )}
        </>
      )}
    </Paper>
  );
};

export default TradingForm;
