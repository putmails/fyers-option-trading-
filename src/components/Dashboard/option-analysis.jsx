import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider,
  Grid,
  Slider,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  calculateOptionPrice, 
  calculateGreeks
} from '../../utils/options-helper';
import { DAYS_IN_A_YEAR } from '../../utils/constant';

const OptionAnalysis = ({ option, underlying, expiryDate }) => {
  const [spotPriceChange, setSpotPriceChange] = useState(0);
  const [daysToExpiryChange, setDaysToExpiryChange] = useState(0);
  const [volatilityChange, setVolatilityChange] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [projectedOutcomes, setProjectedOutcomes] = useState([]);
  
  useEffect(() => {
    if (!option || !underlying || !expiryDate) return;
    
    // Calculate projected outcomes
    calculateProjectedOutcomes();
  }, [option, underlying, expiryDate, spotPriceChange, daysToExpiryChange, volatilityChange]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Format numbers for display
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('en-IN', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  // Calculate projected outcomes based on different price, time, and volatility scenarios
  const calculateProjectedOutcomes = () => {
    if (!option || !underlying || !expiryDate) return;
    
    const type = option.option_type === 'CE' ? 'call' : 'put';
    const spotPrice = underlying.ltp;
    const strikePrice = option.strike_price;
    
    // Calculate days to expiry
    const [day, month, year] = expiryDate.split('-').map(num => parseInt(num, 10));
    const expiryTime = new Date(year, month - 1, day).getTime();
    const currentTime = new Date().getTime();
    const daysToExpiry = Math.max(1, Math.ceil((expiryTime - currentTime) / (1000 * 60 * 60 * 24)));
    
    // Get implied volatility (either from the option or use a default)
    const impliedVolatility = option.greeks ? 
      (option.greeks.vega > 0 ? option.theoreticalPrice / (option.greeks.vega * 100) : 0.3) : 
      0.3;
    
    // Generate scenarios
    const scenarios = [];
    
    // Current scenario
    const baseTimeToExpiry = daysToExpiry / DAYS_IN_A_YEAR;
    const baseOptionPrice = calculateOptionPrice(
      type,
      spotPrice,
      strikePrice,
      baseTimeToExpiry,
      impliedVolatility
    );
    const baseGreeks = calculateGreeks(
      type,
      spotPrice,
      strikePrice,
      baseTimeToExpiry,
      impliedVolatility
    );
    
    scenarios.push({
      scenarioName: 'Current',
      spotPrice,
      daysToExpiry,
      impliedVolatility: impliedVolatility * 100, // Convert to percentage
      optionPrice: baseOptionPrice,
      pnl: 0,
      greeks: baseGreeks
    });
    
    // Spot price scenarios
    const spotPriceScenarios = [
      { change: -10, name: 'Bearish (-10%)' },
      { change: -5, name: 'Slight Bearish (-5%)' },
      { change: 5, name: 'Slight Bullish (+5%)' },
      { change: 10, name: 'Bullish (+10%)' }
    ];
    
    spotPriceScenarios.forEach(scenario => {
      const newSpotPrice = spotPrice * (1 + scenario.change / 100);
      const newOptionPrice = calculateOptionPrice(
        type,
        newSpotPrice,
        strikePrice,
        baseTimeToExpiry,
        impliedVolatility
      );
      const newGreeks = calculateGreeks(
        type,
        newSpotPrice,
        strikePrice,
        baseTimeToExpiry,
        impliedVolatility
      );
      
      scenarios.push({
        scenarioName: scenario.name,
        spotPrice: newSpotPrice,
        daysToExpiry,
        impliedVolatility: impliedVolatility * 100,
        optionPrice: newOptionPrice,
        pnl: newOptionPrice - baseOptionPrice,
        greeks: newGreeks
      });
    });
    
    // Time decay scenario
    if (daysToExpiry > 1) {
      const newDaysToExpiry = Math.max(1, daysToExpiry - 7); // 1 week less
      const newTimeToExpiry = newDaysToExpiry / DAYS_IN_A_YEAR;
      const newOptionPrice = calculateOptionPrice(
        type,
        spotPrice,
        strikePrice,
        newTimeToExpiry,
        impliedVolatility
      );
      const newGreeks = calculateGreeks(
        type,
        spotPrice,
        strikePrice,
        newTimeToExpiry,
        impliedVolatility
      );
      
      scenarios.push({
        scenarioName: 'Time Decay (1 week)',
        spotPrice,
        daysToExpiry: newDaysToExpiry,
        impliedVolatility: impliedVolatility * 100,
        optionPrice: newOptionPrice,
        pnl: newOptionPrice - baseOptionPrice,
        greeks: newGreeks
      });
    }
    
    // Volatility scenarios
    const volatilityScenarios = [
      { change: -20, name: 'Volatility Decrease (-20%)' },
      { change: 20, name: 'Volatility Increase (+20%)' }
    ];
    
    volatilityScenarios.forEach(scenario => {
      const newVolatility = Math.max(0.1, impliedVolatility * (1 + scenario.change / 100));
      const newOptionPrice = calculateOptionPrice(
        type,
        spotPrice,
        strikePrice,
        baseTimeToExpiry,
        newVolatility
      );
      const newGreeks = calculateGreeks(
        type,
        spotPrice,
        strikePrice,
        baseTimeToExpiry,
        newVolatility
      );
      
      scenarios.push({
        scenarioName: scenario.name,
        spotPrice,
        daysToExpiry,
        impliedVolatility: newVolatility * 100,
        optionPrice: newOptionPrice,
        pnl: newOptionPrice - baseOptionPrice,
        greeks: newGreeks
      });
    });
    
    // Custom scenario with all factors
    if (spotPriceChange !== 0 || daysToExpiryChange !== 0 || volatilityChange !== 0) {
      const newSpotPrice = spotPrice * (1 + spotPriceChange / 100);
      const newDaysToExpiry = Math.max(1, daysToExpiry - daysToExpiryChange);
      const newTimeToExpiry = newDaysToExpiry / DAYS_IN_A_YEAR;
      const newVolatility = Math.max(0.1, impliedVolatility * (1 + volatilityChange / 100));
      
      const newOptionPrice = calculateOptionPrice(
        type,
        newSpotPrice,
        strikePrice,
        newTimeToExpiry,
        newVolatility
      );
      const newGreeks = calculateGreeks(
        type,
        newSpotPrice,
        strikePrice,
        newTimeToExpiry,
        newVolatility
      );
      
      scenarios.push({
        scenarioName: 'Custom Scenario',
        spotPrice: newSpotPrice,
        daysToExpiry: newDaysToExpiry,
        impliedVolatility: newVolatility * 100,
        optionPrice: newOptionPrice,
        pnl: newOptionPrice - baseOptionPrice,
        greeks: newGreeks
      });
    }
    
    setProjectedOutcomes(scenarios);
  };
  
  if (!option || !underlying || !expiryDate) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1">
          Select an option to view analysis
        </Typography>
      </Box>
    );
  }
  
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Option Analysis: {option.symbol}
      </Typography>
      
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="option analysis tabs"
        sx={{ mb: 2 }}
      >
        <Tab label="Scenario Analysis" />
        <Tab label="What-If Analysis" />
      </Tabs>
      
      {/* Scenario Analysis Tab */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Projected Outcomes
          </Typography>
          
          {projectedOutcomes.length > 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Scenario</TableCell>
                    <TableCell align="right">Spot Price</TableCell>
                    <TableCell align="right">Days</TableCell>
                    <TableCell align="right">IV %</TableCell>
                    <TableCell align="right">Option Price</TableCell>
                    <TableCell align="right">P&L</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projectedOutcomes.map((scenario, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">
                        {scenario.scenarioName}
                      </TableCell>
                      <TableCell align="right">₹{formatNumber(scenario.spotPrice)}</TableCell>
                      <TableCell align="right">{scenario.daysToExpiry}</TableCell>
                      <TableCell align="right">{formatNumber(scenario.impliedVolatility, 1)}%</TableCell>
                      <TableCell align="right">₹{formatNumber(scenario.optionPrice)}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: scenario.pnl > 0 ? 'success.main' : scenario.pnl < 0 ? 'error.main' : 'text.primary',
                          fontWeight: scenario.pnl !== 0 ? 'bold' : 'normal'
                        }}
                      >
                        {scenario.pnl === 0 ? '-' : `${scenario.pnl > 0 ? '+' : ''}₹${formatNumber(scenario.pnl)}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Greeks Analysis
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Delta Interpretation
                  </Typography>
                  <Typography variant="body2">
                    Delta of {formatNumber(projectedOutcomes[0]?.greeks?.delta || 0, 3)} indicates that for a ₹1 change in the underlying price, the option price will change by approximately ₹{formatNumber(Math.abs(projectedOutcomes[0]?.greeks?.delta || 0), 3)}.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                                      <Typography variant="subtitle2" gutterBottom>
                    Theta Interpretation
                  </Typography>
                  <Typography variant="body2">
                    Theta of {formatNumber(projectedOutcomes[0]?.greeks?.theta || 0, 2)} means the option loses approximately ₹{formatNumber(Math.abs(projectedOutcomes[0]?.greeks?.theta || 0), 2)} in value per day as time passes, all else being equal.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Gamma Interpretation
                  </Typography>
                  <Typography variant="body2">
                    Gamma of {formatNumber(projectedOutcomes[0]?.greeks?.gamma || 0, 4)} means the rate of change of Delta. High gamma indicates the option's delta will change rapidly with small price movements in the underlying.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Vega Interpretation
                  </Typography>
                  <Typography variant="body2">
                    Vega of {formatNumber(projectedOutcomes[0]?.greeks?.vega || 0, 2)} means the option price will change by approximately ₹{formatNumber(projectedOutcomes[0]?.greeks?.vega || 0, 2)} for every 1% change in implied volatility.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* What-If Analysis Tab */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Adjust Parameters
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography gutterBottom>
                Underlying Price Change: {spotPriceChange > 0 ? '+' : ''}{spotPriceChange}%
              </Typography>
              <Slider
                value={spotPriceChange}
                onChange={(e, newValue) => setSpotPriceChange(newValue)}
                min={-50}
                max={50}
                step={1}
                marks={[
                  { value: -50, label: '-50%' },
                  { value: -25, label: '-25%' },
                  { value: 0, label: '0%' },
                  { value: 25, label: '+25%' },
                  { value: 50, label: '+50%' }
                ]}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>
                Days to Expiry Reduction: {daysToExpiryChange} days
              </Typography>
              <Slider
                value={daysToExpiryChange}
                onChange={(e, newValue) => setDaysToExpiryChange(newValue)}
                min={0}
                max={30}
                step={1}
                marks={[
                  { value: 0, label: '0' },
                  { value: 7, label: '7' },
                  { value: 14, label: '14' },
                  { value: 21, label: '21' },
                  { value: 30, label: '30' }
                ]}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>
                Volatility Change: {volatilityChange > 0 ? '+' : ''}{volatilityChange}%
              </Typography>
              <Slider
                value={volatilityChange}
                onChange={(e, newValue) => setVolatilityChange(newValue)}
                min={-50}
                max={50}
                step={5}
                marks={[
                  { value: -50, label: '-50%' },
                  { value: -25, label: '-25%' },
                  { value: 0, label: '0%' },
                  { value: 25, label: '+25%' },
                  { value: 50, label: '+50%' }
                ]}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showAdvanced}
                    onChange={(e) => setShowAdvanced(e.target.checked)}
                  />
                }
                label="Show Advanced Analysis"
              />
            </Grid>
          </Grid>
          
          {showAdvanced && projectedOutcomes.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Custom Scenario Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Parameter</TableCell>
                          <TableCell align="right">Current</TableCell>
                          <TableCell align="right">Modified</TableCell>
                          <TableCell align="right">Change</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Spot Price</TableCell>
                          <TableCell align="right">₹{formatNumber(underlying.ltp)}</TableCell>
                          <TableCell align="right">₹{formatNumber(projectedOutcomes[projectedOutcomes.length - 1]?.spotPrice || 0)}</TableCell>
                          <TableCell 
                            align="right"
                            sx={{ 
                              color: spotPriceChange > 0 ? 'success.main' : spotPriceChange < 0 ? 'error.main' : 'text.primary',
                              fontWeight: 'medium'
                            }}
                          >
                            {spotPriceChange > 0 ? '+' : ''}{spotPriceChange}%
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Days to Expiry</TableCell>
                          <TableCell align="right">{projectedOutcomes[0]?.daysToExpiry || 0}</TableCell>
                          <TableCell align="right">{projectedOutcomes[projectedOutcomes.length - 1]?.daysToExpiry || 0}</TableCell>
                          <TableCell 
                            align="right"
                            sx={{ 
                              color: daysToExpiryChange > 0 ? 'error.main' : 'text.primary',
                              fontWeight: 'medium'
                            }}
                          >
                            {daysToExpiryChange > 0 ? '-' : ''}{daysToExpiryChange}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Implied Volatility</TableCell>
                          <TableCell align="right">{formatNumber(projectedOutcomes[0]?.impliedVolatility || 0, 1)}%</TableCell>
                          <TableCell align="right">{formatNumber(projectedOutcomes[projectedOutcomes.length - 1]?.impliedVolatility || 0, 1)}%</TableCell>
                          <TableCell 
                            align="right"
                            sx={{ 
                              color: volatilityChange > 0 ? 'success.main' : volatilityChange < 0 ? 'error.main' : 'text.primary',
                              fontWeight: 'medium'
                            }}
                          >
                            {volatilityChange > 0 ? '+' : ''}{volatilityChange}%
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Option Price</TableCell>
                          <TableCell align="right">₹{formatNumber(projectedOutcomes[0]?.optionPrice || 0)}</TableCell>
                          <TableCell align="right">₹{formatNumber(projectedOutcomes[projectedOutcomes.length - 1]?.optionPrice || 0)}</TableCell>
                          <TableCell 
                            align="right"
                            sx={{ 
                              color: projectedOutcomes[projectedOutcomes.length - 1]?.pnl > 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold'
                            }}
                          >
                            {projectedOutcomes[projectedOutcomes.length - 1]?.pnl > 0 ? '+' : ''}
                            ₹{formatNumber(projectedOutcomes[projectedOutcomes.length - 1]?.pnl || 0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Greeks Comparison
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Greek</TableCell>
                          <TableCell align="right">Current</TableCell>
                          <TableCell align="right">Modified</TableCell>
                          <TableCell align="right">Change</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Delta</TableCell>
                          <TableCell align="right">{formatNumber(projectedOutcomes[0]?.greeks?.delta || 0, 3)}</TableCell>
                          <TableCell align="right">{formatNumber(projectedOutcomes[projectedOutcomes.length - 1]?.greeks?.delta || 0, 3)}</TableCell>
                          <TableCell align="right">
                            {formatNumber(
                              (projectedOutcomes[projectedOutcomes.length - 1]?.greeks?.delta || 0) - 
                              (projectedOutcomes[0]?.greeks?.delta || 0),
                              3
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Gamma</TableCell>
                          <TableCell align="right">{formatNumber(projectedOutcomes[0]?.greeks?.gamma || 0, 4)}</TableCell>
                          <TableCell align="right">{formatNumber(projectedOutcomes[projectedOutcomes.length - 1]?.greeks?.gamma || 0, 4)}</TableCell>
                          <TableCell align="right">
                            {formatNumber(
                              (projectedOutcomes[projectedOutcomes.length - 1]?.greeks?.gamma || 0) - 
                              (projectedOutcomes[0]?.greeks?.gamma || 0),
                              4
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Theta</TableCell>
                          <TableCell align="right">{formatNumber(projectedOutcomes[0]?.greeks?.theta || 0, 2)}</TableCell>
                          <TableCell align="right">{formatNumber(projectedOutcomes[projectedOutcomes.length - 1]?.greeks?.theta || 0, 2)}</TableCell>
                          <TableCell align="right">
                            {formatNumber(
                              (projectedOutcomes[projectedOutcomes.length - 1]?.greeks?.theta || 0) - 
                              (projectedOutcomes[0]?.greeks?.theta || 0),
                              2
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Vega</TableCell>
                          <TableCell align="right">{formatNumber(projectedOutcomes[0]?.greeks?.vega || 0, 2)}</TableCell>
                          <TableCell align="right">{formatNumber(projectedOutcomes[projectedOutcomes.length - 1]?.greeks?.vega || 0, 2)}</TableCell>
                          <TableCell align="right">
                            {formatNumber(
                              (projectedOutcomes[projectedOutcomes.length - 1]?.greeks?.vega || 0) - 
                              (projectedOutcomes[0]?.greeks?.vega || 0),
                              2
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default OptionAnalysis;