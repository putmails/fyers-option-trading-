import React, {  useMemo } from 'react';
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
import useOptionStore from '../../store/option-store';

const OptionDetails = () => {
  // Get state from Zustand store
  const { 
    underlying, 
    selectedRowStrikePrice:strikePrice,
    selectedOptionDetail:option, 
    selectedOptionType: optionType,
    volatilityData,
  } = useOptionStore();

  // Early return if no option is selected
  if (!option) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1">
          Select an option from the chain to view details
        </Typography>
      </Box>
    );
  }

  return <OptionDetailsPCR strikePrice={strikePrice} option={option} optionType={optionType} underlying={underlying} volatilityData={volatilityData}/>

 
};

export default OptionDetails;

const OptionDetailsPCR = ({strikePrice, option, optionType, underlying, volatilityData}) => {

   // const { option, strikePrice, optionType } = selectedOptionData;
   const isCall = optionType === 'call';
   const isPut = optionType === 'put';
 
   // Format numbers for display
   const formatNumber = (num, decimals = 2) => {
     if (num === null || num === undefined) return '-';
     return num.toLocaleString('en-IN', { 
       minimumFractionDigits: decimals,
       maximumFractionDigits: decimals
     });
   };
 
   // Determine if option is ITM, ATM, or OTM
   const spotPrice = underlying?.ltp || 0;
   
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
 
   // Get trading recommendation from volatility analysis
   const volatilityAnalysis = option.volatilityAnalysis;
   const tradingRecommendation = useMemo(() => {
     if (!volatilityAnalysis) return null;
 
     // Determine action based on multiple factors
     let action = 'HOLD';
     let confidence = 50;
     let reason = 'Price is close to theoretical value';
 
     // Check price difference
     const priceDiff = option.priceDifference;
     if (priceDiff && Math.abs(priceDiff) > 10) {
       if (priceDiff > 0) {
         action = 'SELL';
         confidence = Math.min(100, Math.round(Math.abs(priceDiff) * 2));
         reason = `Option appears overpriced by ${priceDiff.toFixed(1)}% relative to theoretical value`;
       } else {
         action = 'BUY';
         confidence = Math.min(100, Math.round(Math.abs(priceDiff) * 2));
         reason = `Option appears underpriced by ${Math.abs(priceDiff).toFixed(1)}% relative to theoretical value`;
       }
     }
 
     // Consider volatility analysis
     if (volatilityAnalysis.tradingSignal) {
       if (volatilityAnalysis.tradingSignal.includes('BUY')) {
         action = 'BUY';
         confidence = Math.min(100, confidence + 20);
         reason = `${reason} and volatility analysis suggests buying`;
       } else if (volatilityAnalysis.tradingSignal.includes('SELL')) {
         action = 'SELL';
         confidence = Math.min(100, confidence + 20);
         reason = `${reason} and volatility analysis suggests selling`;
       }
     }
 
     return { action, confidence, reason };
   }, [option, volatilityAnalysis]);
 
   // Handle buy/sell buttons
   const handleTrade = (action) => {
     // This could be connected to a trading API or order placement system
     console.log(`${action} ${isCall ? 'CALL' : 'PUT'} option at strike ${strikePrice}`);
   };
 
   return (
     <Paper sx={{ p: 2, height: '100%', overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
       <Box sx={{ mb: 2 }}>
         <Stack direction="row" justifyContent="space-between" alignItems="center">
           <Typography variant="h6" gutterBottom>
             {option.symbol || `${underlying?.symbol} ${formatNumber(strikePrice, 0)}`}
           </Typography>
           <Chip 
             label={moneyStatus} 
             color={getStatusColor()} 
             size="small"
             sx={{ fontWeight: 'bold' }} 
           />
         </Stack>
         <Typography variant="body2" color="text.secondary">
           {isCall ? 'Call Option' : 'Put Option'} • Strike: ₹{formatNumber(strikePrice, 0)}
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
                     {(option.impliedVolatility * 100).toFixed(1)}%
                   </Typography>
                 </Grid>
                 <Grid item xs={6}>
                   <Typography variant="body2" color="text.secondary">Historical Vol (HV):</Typography>
                   <Typography variant="body1">
                     {(volatilityData.historicalVolatility * 100).toFixed(1)}%
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
             {(option.ltpchp || 0) >= 0 ? (
               <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
             ) : (
               <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
             )}
             <Typography 
               variant="body1"
               color={(option.ltpchp || 0) >= 0 ? 'success.main' : 'error.main'}
               fontWeight="medium"
             >
               {(option.ltpchp || 0) >= 0 ? '+' : ''}{formatNumber(option.ltpchp || 0)}%
             </Typography>
           </Box>
         </Grid>
         
         {/* Price Analysis */}
         {option.theoreticalPrice && (
           <>
             <Grid item xs={6}>
               <Typography variant="body2" color="text.secondary">Theoretical Price</Typography>
               <Typography variant="body1">₹{formatNumber(option.theoreticalPrice)}</Typography>
             </Grid>
             <Grid item xs={6}>
               <Typography variant="body2" color="text.secondary">Price Difference</Typography>
               <Typography 
                 variant="body1" 
                 color={option.priceDifference > 0 ? 'error.main' : 'success.main'}
                 fontWeight="medium"
               >
                 {option.priceDifference > 0 ? '+' : ''}
                 {formatNumber(option.priceDifference, 1)}%
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
       {option.greeks ? (
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
                 <TableCell>{formatNumber(option.greeks.delta, 3)}</TableCell>
                 <TableCell>{formatNumber(option.greeks.gamma, 4)}</TableCell>
                 <TableCell>{formatNumber(option.greeks.theta, 2)}</TableCell>
                 <TableCell>{formatNumber(option.greeks.vega, 2)}</TableCell>
               </TableRow>
             </TableBody>
           </Table>
           <Box sx={{ mt: 1 }}>
             <Typography variant="caption" color="text.secondary">
               Delta represents the rate of change of option price with respect to changes in the underlying asset price.
               {isCall ? 
                 ` This call option's delta of ${formatNumber(option.greeks.delta, 3)} means it will gain approximately ₹${formatNumber(option.greeks.delta, 2)} for every ₹1 increase in the underlying.` : 
                 ` This put option's delta of ${formatNumber(option.greeks.delta, 3)} means it will gain approximately ₹${formatNumber(Math.abs(option.greeks.delta), 2)} for every ₹1 decrease in the underlying.`
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
               <strong>Moneyness:</strong> {moneyStatus} option with {formatNumber(Math.abs(spotPrice - strikePrice))} points {moneyStatus === 'ITM' ? 'in-the-money' : 'out-of-the-money'}
             </Typography>
           </li>
           <li>
             <Typography variant="body2">
               <strong>Price vs Theory:</strong> {option.priceDifference && option.priceDifference > 5 ? 'Potentially overpriced' : option.priceDifference && option.priceDifference < -5 ? 'Potentially underpriced' : 'Fair price'}
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
           IV: {option.impliedVolatility ? `${(option.impliedVolatility * 100).toFixed(2)}%` : '-'}
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
             onClick={() => handleTrade('BUY')}
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
             onClick={() => handleTrade('SELL')}
           >
             Sell
           </Button>
         </Stack>
       </Box>
     </Paper>
   );
}