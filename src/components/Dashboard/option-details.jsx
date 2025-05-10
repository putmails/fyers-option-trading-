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
  Alert,
  LinearProgress,
  Card,
  CardContent
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { calculateGreeks, calculateImpliedVolatility } from '../../utils/options-helper';
import { analyzeOptionVolatility } from '../../utils/volatility-analysis';

const OptionDetails = ({ option, underlying,  expiryDate }) => {
  const [greeks, setGreeks] = useState(null);
  const [iv, setIv] = useState(null);
  const [pricingAnalysis, setPricingAnalysis] = useState(null);
  const [tradingRecommendation, setTradingRecommendation] = useState(null);
  const [volatilityAnalysis, setVolatilityAnalysis] = useState(null);
  
  // Calculate implied volatility and Greeks when option data changes
  useEffect(() => {
    if (!option || !underlying || !option.option_type || !expiryDate) {
      return;
    }
    
    // Get the type (call or put)
    const type = option.option_type === 'CE' ? 'call' : 'put';
    
    // Calculate days to expiry
    const [day, month, year] = expiryDate.split('-').map(num => parseInt(num, 10));
    const expiryTime = new Date(year, month - 1, day).getTime();
    const currentTime = new Date().getTime();
    const daysToExpiry = Math.max(0, Math.ceil((expiryTime - currentTime) / (1000 * 60 * 60 * 24)));
    
    // Convert days to years for the calculations
    const timeToExpiry = daysToExpiry / 365;
    
    let impliedVol;
    let calculatedGreeks;
    
    // Check if we already have theoretical price and greeks from enhanced option data
    if (option.theoreticalPrice && option.greeks) {
      impliedVol = (option.greeks.vega > 0) ? option.theoreticalPrice / (option.greeks.vega * 100) : 0.3;
      calculatedGreeks = option.greeks;
    } else {
      // Calculate implied volatility (simplified approach)
      impliedVol = calculateImpliedVolatility(
        type,
        option.ltp,
        underlying.ltp,
        option.strike_price,
        timeToExpiry
      );
      
      // Calculate Greeks
      calculatedGreeks = calculateGreeks(
        type,
        underlying.ltp,
        option.strike_price,
        timeToExpiry,
        impliedVol
      );
    }
    
    setIv(impliedVol);
    setGreeks(calculatedGreeks);
    
    // Analyze pricing if we have theoretical price
    if (option.theoreticalPrice) {
      const priceDiff = option.ltp - option.theoreticalPrice;
      const percentDiff = (priceDiff / option.theoreticalPrice) * 100;
      
      setPricingAnalysis({
        marketPrice: option.ltp,
        theoreticalPrice: option.theoreticalPrice,
        priceDifference: priceDiff,
        percentDifference: percentDiff
      });
      
      // Generate trading recommendation
      let recommendation = null;
      const THRESHOLD = 10; // 10% threshold for significant mispricing
      
      if (Math.abs(percentDiff) >= THRESHOLD) {
        if (percentDiff > 0) {
          // Market price > theoretical price = overpriced
          recommendation = {
            action: 'SELL',
            confidence: Math.min(100, Math.round(Math.abs(percentDiff) * 2)),
            reason: `Option appears overpriced by ${percentDiff.toFixed(1)}% relative to theoretical value`
          };
        } else {
          // Market price < theoretical price = underpriced
          recommendation = {
            action: 'BUY',
            confidence: Math.min(100, Math.round(Math.abs(percentDiff) * 2)),
            reason: `Option appears underpriced by ${Math.abs(percentDiff).toFixed(1)}% relative to theoretical value`
          };
        }
      } else {
        recommendation = {
          action: 'HOLD',
          confidence: Math.min(100, 100 - Math.round(Math.abs(percentDiff) * 5)),
          reason: 'Price is close to theoretical value'
        };
      }
      
      setTradingRecommendation(recommendation);
    }
    
    // Perform volatility analysis (IV-HV comparison)
    const volAnalysis = option.volatilityAnalysis || analyzeOptionVolatility(
      {
        ...option,
        impliedVolatility: impliedVol,
        theoreticalPrice: option.theoreticalPrice,
        greeks: calculatedGreeks
      },
      underlying
    );
    
    setVolatilityAnalysis(volAnalysis);
    
    // If we have both pricing and volatility analysis, combine them for the trading recommendation
    if (pricingAnalysis && volAnalysis) {
      // Check if both analyses agree
      const pricingDirection = pricingAnalysis.percentDifference > 0 ? 'SELL' : 'BUY';
      const volatilityDirection = volAnalysis.tradingSignal && volAnalysis.tradingSignal.includes('SELL') ? 'SELL' : 'BUY';
      
      // If they agree, increase confidence in the recommendation
      if (pricingDirection === volatilityDirection) {
        const recommendation = {
          action: pricingDirection,
          confidence: Math.min(100, Math.round(Math.abs(pricingAnalysis.percentDifference) * 2.5)),
          reason: `Strong ${pricingDirection} signal: Option is ${pricingDirection === 'SELL' ? 'overpriced' : 'underpriced'} by theory price (${Math.abs(pricingAnalysis.percentDifference).toFixed(1)}%) and IV/HV analysis (${volAnalysis.skewPercentage.toFixed(1)}%)`
        };
        
        setTradingRecommendation(recommendation);
      }
    }
    
  }, [option, underlying, expiryDate, pricingAnalysis]);
  
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
      maximumFractionDigits: decimals
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
    <Paper sx={{ p: 2, height: '100%', overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
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
          {isCall ? 'Call Option' : 'Put Option'} • Strike: ₹{formatNumber(strikePrice)}
        </Typography>
      </Box>
      
      {/* Trading Recommendation */}
      {tradingRecommendation && (
        <Box sx={{ mb: 2 }}>
          <Alert 
            severity={
              tradingRecommendation.action === 'BUY' 
                ? 'success' 
                : tradingRecommendation.action === 'SELL' 
                  ? 'error' 
                  : 'info'
            }
            icon={
              tradingRecommendation.action === 'BUY' 
                ? <ArrowUpwardIcon /> 
                : tradingRecommendation.action === 'SELL' 
                  ? <ArrowDownwardIcon />
                  : false
            }
          >
            <Typography variant="subtitle2">
              {tradingRecommendation.action} {isCall ? 'CALL' : 'PUT'}
            </Typography>
            <Typography variant="body2">
              {tradingRecommendation.reason}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="caption" sx={{ mr: 1 }}>
                Confidence:
              </Typography>
              <LinearProgress
                variant="determinate"
                value={tradingRecommendation.confidence}
                color={
                  tradingRecommendation.action === 'BUY' 
                    ? 'success' 
                    : tradingRecommendation.action === 'SELL' 
                      ? 'error' 
                      : 'primary'
                }
                sx={{ width: '100%', height: 6, borderRadius: 3 }}
              />
              <Typography variant="caption" sx={{ ml: 1 }}>
                {tradingRecommendation.confidence}%
              </Typography>
            </Box>
          </Alert>
        </Box>
      )}
      
      {/* Volatility Analysis */}
      {volatilityAnalysis && (
        <Box sx={{ mb: 2 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Volatility Analysis
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Implied Vol (IV):</Typography>
                  <Typography variant="body1">
                    {(volatilityAnalysis.impliedVolatility * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Historical Vol (HV):</Typography>
                  <Typography variant="body1">
                    {(volatilityAnalysis.historicalVolatility * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">IV/HV Ratio:</Typography>
                  <Typography 
                    variant="body1" 
                    color={
                      volatilityAnalysis.skewRatio > 1.1 ? 'error.main' : 
                      volatilityAnalysis.skewRatio < 0.9 ? 'success.main' : 
                      'text.primary'
                    }
                  >
                    {volatilityAnalysis.skewRatio.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">IV-HV Difference:</Typography>
                  <Typography 
                    variant="body1" 
                    color={
                      volatilityAnalysis.skewDifference > 0 ? 'error.main' : 
                      volatilityAnalysis.skewDifference < 0 ? 'success.main' : 
                      'text.primary'
                    }
                  >
                    {(volatilityAnalysis.skewDifference * 100).toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {volatilityAnalysis.interpretation}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">LTP</Typography>
          <Typography variant="h6">₹{formatNumber(option.ltp)}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Change</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {option.ltpchp >= 0 ? (
              <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
            ) : (
              <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
            )}
            <Typography 
              variant="body1"
              color={option.ltpchp >= 0 ? 'success.main' : 'error.main'}
              fontWeight="medium"
            >
              {option.ltpchp >= 0 ? '+' : ''}{formatNumber(option.ltpchp)}%
            </Typography>
          </Box>
        </Grid>
        
        {/* Price Analysis */}
        {pricingAnalysis && (
          <>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Theoretical Price</Typography>
              <Typography variant="body1">₹{formatNumber(pricingAnalysis.theoreticalPrice)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Price Difference</Typography>
              <Typography 
                variant="body1" 
                color={pricingAnalysis.priceDifference > 0 ? 'error.main' : 'success.main'}
                fontWeight="medium"
              >
                {pricingAnalysis.priceDifference > 0 ? '+' : ''}
                {formatNumber(pricingAnalysis.priceDifference)} 
                ({pricingAnalysis.priceDifference > 0 ? '+' : ''}
                {formatNumber(pricingAnalysis.percentDifference, 1)}%)
              </Typography>
            </Grid>
          </>
        )}
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Volume</Typography>
          <Typography variant="body1">{formatNumber(option.volume || 0, 0)}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Open Interest</Typography>
          <Typography variant="body1">{formatNumber(option.oi || 0, 0)}</Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Bid</Typography>
          <Typography variant="body1">₹{formatNumber(option.bid || 0)}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Ask</Typography>
          <Typography variant="body1">₹{formatNumber(option.ask || 0)}</Typography>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>Value Breakdown</Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Intrinsic Value</Typography>
          <Typography variant="body1">₹{formatNumber(intrinsicValue)}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Time Value</Typography>
          <Typography variant="body1">₹{formatNumber(timeValue)}</Typography>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>Greeks</Typography>
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
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Delta represents the rate of change of option price with respect to changes in the underlying asset price.
              {isCall ? 
                ` This call option's delta of ${formatNumber(greeks.delta, 3)} means it will gain approximately ₹${formatNumber(greeks.delta, 2)} for every ₹1 increase in the underlying.` : 
                ` This put option's delta of ${formatNumber(greeks.delta, 3)} means it will gain approximately ₹${formatNumber(Math.abs(greeks.delta), 2)} for every ₹1 decrease in the underlying.`
              }
            </Typography>
          </Box>
        </TableContainer>
      ) : (
        <Typography variant="body2" color="text.secondary" align="center">
          Loading Greeks...
        </Typography>
      )}
      
      {/* Strategy Considerations */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" gutterBottom>Strategy Considerations</Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Key Factors:</strong>
        </Typography>
        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
          <li>
            <Typography variant="body2">
              <strong>Moneyness:</strong> {moneyStatus} option with {formatNumber(Math.abs(spotPrice - strikePrice))} points {spotPrice > strikePrice ? 'in-the-money' : 'out-of-the-money'}
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Price vs Theory:</strong> {pricingAnalysis && pricingAnalysis.percentDifference > 5 ? 'Potentially overpriced' : pricingAnalysis && pricingAnalysis.percentDifference < -5 ? 'Potentially underpriced' : 'Fair price'}
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>IV vs HV:</strong> {volatilityAnalysis && volatilityAnalysis.skewRatio > 1.1 ? 'IV premium (overpriced volatility)' : volatilityAnalysis && volatilityAnalysis.skewRatio < 0.9 ? 'IV discount (underpriced volatility)' : 'Balanced volatility pricing'}
            </Typography>
          </li>
        </ul>
      </Box>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          IV: {iv ? `${(iv * 100).toFixed(2)}%` : '-'}
        </Typography>
        
        <Stack direction="row" spacing={1}>
          <Button 
            variant="outlined" 
            size="small" 
            color={
              tradingRecommendation?.action === 'BUY' || 
              (volatilityAnalysis?.tradingSignal && volatilityAnalysis.tradingSignal.includes('BUY')) 
                ? 'success' 
                : 'primary'
            }
          >
            Buy
          </Button>
          <Button 
            variant="outlined" 
            size="small" 
            color={
              tradingRecommendation?.action === 'SELL' || 
              (volatilityAnalysis?.tradingSignal && volatilityAnalysis.tradingSignal.includes('SELL')) 
                ? 'error' 
                : 'primary'
            }
          >
            Sell
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export default OptionDetails;