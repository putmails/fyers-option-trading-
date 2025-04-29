import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import {
  calculateGreeks,
  calculateImpliedVolatility,
} from '../../utils/options-helper';

const OptionDetails = ({ option, underlying, expiryDate }) => {
  const [greeks, setGreeks] = useState(null);
  const [iv, setIv] = useState(null);

  // Calculate implied volatility and Greeks when option data changes
  useEffect(() => {
    if (!option || !underlying || !option.option_type || !expiryDate) {
      return;
    }

    // Get the type (call or put)
    const type = option.option_type === 'CE' ? 'call' : 'put';

    // Calculate days to expiry
    const [day, month, year] = expiryDate
      .split('-')
      .map((num) => parseInt(num, 10));
    const expiryTime = new Date(year, month - 1, day).getTime();
    const currentTime = new Date().getTime();
    const daysToExpiry = Math.max(
      0,
      Math.ceil((expiryTime - currentTime) / (1000 * 60 * 60 * 24))
    );

    // Convert days to years for the calculations
    const timeToExpiry = daysToExpiry / 365;

    // Calculate implied volatility (simplified approach)
    const impliedVol = calculateImpliedVolatility(
      type,
      option.ltp,
      underlying.ltp,
      option.strike_price,
      timeToExpiry
    );
    setIv(impliedVol);

    // Calculate Greeks
    const calculatedGreeks = calculateGreeks(
      type,
      underlying.ltp,
      option.strike_price,
      timeToExpiry,
      impliedVol
    );
    setGreeks(calculatedGreeks);
  }, [option, underlying, expiryDate]);

  // If no option data, show a message
  if (!option || !underlying) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1">
          Select an option to view details
        </Typography>
      </Box>
    );
  }

  // Format numbers for display
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Determine if option is ITM, ATM, or OTM
  const isCall = option.option_type === 'CE';
  const isPut = option.option_type === 'PE';
  const spotPrice = underlying.ltp;
  const strikePrice = option.strike_price;

  let moneyStatus = 'ATM';
  if (isCall && spotPrice > strikePrice) moneyStatus = 'ITM';
  if (isCall && spotPrice < strikePrice) moneyStatus = 'OTM';
  if (isPut && spotPrice < strikePrice) moneyStatus = 'ITM';
  if (isPut && spotPrice > strikePrice) moneyStatus = 'OTM';

  // Style based on status
  const getStatusColor = () => {
    if (moneyStatus === 'ITM') return 'success';
    if (moneyStatus === 'OTM') return 'error';
    return 'warning';
  };

  // Calculate intrinsic and time value
  const intrinsicValue = isCall
    ? Math.max(0, spotPrice - strikePrice)
    : Math.max(0, strikePrice - spotPrice);

  const timeValue = Math.max(0, option.ltp - intrinsicValue);

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ mb: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6" gutterBottom>
            {option.symbol}
          </Typography>
          <Chip
            label={moneyStatus}
            color={getStatusColor()}
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {isCall ? 'Call Option' : 'Put Option'} • Strike: ₹
          {formatNumber(strikePrice)}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            LTP
          </Typography>
          <Typography variant="h6">₹{formatNumber(option.ltp)}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Change
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {option.ltpchp >= 0 ? (
              <TrendingUpIcon
                color="success"
                fontSize="small"
                sx={{ mr: 0.5 }}
              />
            ) : (
              <TrendingDownIcon
                color="error"
                fontSize="small"
                sx={{ mr: 0.5 }}
              />
            )}
            <Typography
              variant="body1"
              color={option.ltpchp >= 0 ? 'success.main' : 'error.main'}
              fontWeight="medium"
            >
              {option.ltpchp >= 0 ? '+' : ''}
              {formatNumber(option.ltpchp)}%
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Volume
          </Typography>
          <Typography variant="body1">
            {formatNumber(option.volume || 0, 0)}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Open Interest
          </Typography>
          <Typography variant="body1">
            {formatNumber(option.oi || 0, 0)}
          </Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Bid
          </Typography>
          <Typography variant="body1">
            ₹{formatNumber(option.bid || 0)}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Ask
          </Typography>
          <Typography variant="body1">
            ₹{formatNumber(option.ask || 0)}
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        Value Breakdown
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Intrinsic Value
          </Typography>
          <Typography variant="body1">
            ₹{formatNumber(intrinsicValue)}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Time Value
          </Typography>
          <Typography variant="body1">₹{formatNumber(timeValue)}</Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        Greeks
      </Typography>
      {greeks ? (
        <TableContainer component={Box}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Delta</TableCell>
                <TableCell>Gamma</TableCell>
                <TableCell>Theta</TableCell>
                <TableCell>Vega</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{formatNumber(greeks.delta, 3)}</TableCell>
                <TableCell>{formatNumber(greeks.gamma, 4)}</TableCell>
                <TableCell>{formatNumber(greeks.theta, 2)}</TableCell>
                <TableCell>{formatNumber(greeks.vega, 2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" color="text.secondary" align="center">
          Loading Greeks...
        </Typography>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          IV: {iv ? `${(iv * 100).toFixed(2)}%` : '-'}
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            color={isCall ? 'success' : 'error'}
          >
            {isCall ? 'Buy Call' : 'Buy Put'}
          </Button>
          <Button variant="outlined" size="small" color="primary">
            Analyze
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export default OptionDetails;
