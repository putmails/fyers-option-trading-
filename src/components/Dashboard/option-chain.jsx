import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  IconButton,
  Slider,
  Stack,
  Grid,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {
  getOptionChainData,
  getAvailableSymbols,
  formatOptionChainData,
} from '../../services/fyers-option-chain-service';
import {
  calculateSupportResistance,
  estimateImpliedVolatility,
  calculateTheoreticalPrices,
  identifyTradingOpportunities,
} from '../../utils/options-analysis';
import { analyzeOptionVolatility } from '../../utils/volatility-analysis';

const OptionChain = ({ onOptionSelect, onDataUpdate }) => {
  // State for form controls
  const [symbol, setSymbol] = useState('NSE:NIFTY50-INDEX');
  const [strikeCount, setStrikeCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for option chain data
  const [availableSymbols, setAvailableSymbols] = useState([]);
  const [expiryDates, setExpiryDates] = useState([]);
  const [selectedExpiry, setSelectedExpiry] = useState('');
  const [optionChainData, setOptionChainData] = useState(null);
  const [underlying, setUnderlying] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [options, setOptions] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedOptionType, setSelectedOptionType] = useState(null); // 'call' or 'put'

  // State for analysis data
  const [supportResistance, setSupportResistance] = useState({
    support: [],
    resistance: [],
  });
  const [impliedVolatility, setImpliedVolatility] = useState(0.3);
  const [historicalVolatility, setHistoricalVolatility] = useState(0.25);
  const [enhancedOptions, setEnhancedOptions] = useState([]);
  const [tradingOpportunities, setTradingOpportunities] = useState({
    callOpportunities: [],
    putOpportunities: [],
  });
  const [volatilitySkew, setVolatilitySkew] = useState(null);

  // Fetch available symbols on component mount
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const symbols = await getAvailableSymbols();
        setAvailableSymbols(symbols);
      } catch (err) {
        console.error('Error fetching symbols:', err);
        setError('Failed to load available symbols');
      }
    };

    fetchSymbols();
  }, []);

  // Fetch data when component mounts or symbol changes

  // Fetch option chain data
  const fetchOptionChain = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getOptionChainData(symbol, strikeCount);
      const formatted = formatOptionChainData(data);

      setUnderlying(formatted.underlying);
      setOptions(formatted.options);
      setExpiryDates(formatted.expiryDates);

      if (formatted.expiryDates.length > 0 && !selectedExpiry) {
        setSelectedExpiry(formatted.expiryDates[0].value);
      }

      setOptionChainData(data); // Store raw data

      // Pass data to parent component
      if (onDataUpdate) {
        onDataUpdate(data);
      }

      // Calculate support and resistance levels
      if (formatted.underlying && formatted.underlying.ltp) {
        const spotPrice = formatted.underlying.ltp;

        // Estimate implied volatility from market data
        const estimatedIV = estimateImpliedVolatility(
          formatted.options,
          spotPrice
        );
        setImpliedVolatility(estimatedIV);

        // Estimate historical volatility (in a real app, this would come from market data)
        // For now, we'll simulate it as slightly lower than IV
        const estimatedHV = estimatedIV * 0.85;
        setHistoricalVolatility(estimatedHV);

        // Calculate volatility skew
        const skewAnalysis = {
          skewRatio: estimatedIV / estimatedHV,
          skewDifference: estimatedIV - estimatedHV,
          skewPercentage: ((estimatedIV - estimatedHV) / estimatedHV) * 100,
        };
        setVolatilitySkew(skewAnalysis);

        // Calculate support/resistance levels
        const levels = calculateSupportResistance(
          spotPrice,
          formatted.options,
          estimatedIV
        );
        setSupportResistance(levels);

        // Get current expiry date in DD-MM-YYYY format
        const expiryDate =
          formatted.expiryDates.length > 0
            ? formatted.expiryDates[0].label
            : '';

        // Calculate theoretical prices
        const optionsWithTheoreticalPrices = calculateTheoreticalPrices(
          formatted.options,
          spotPrice,
          expiryDate,
          estimatedIV
        );

        // Add volatility analysis to each option
        const optionsWithVolatilityAnalysis = optionsWithTheoreticalPrices.map(
          (option) => {
            const enhancedOption = { ...option };

            if (option.call) {
              const volatilityAnalysis = analyzeOptionVolatility(
                {
                  ...option.call,
                  impliedVolatility: estimatedIV,
                  theoreticalPrice: option.call.theoreticalPrice,
                  greeks: option.call.greeks,
                },
                formatted.underlying
              );

              enhancedOption.call = {
                ...option.call,
                volatilityAnalysis,
              };
            }

            if (option.put) {
              const volatilityAnalysis = analyzeOptionVolatility(
                {
                  ...option.put,
                  impliedVolatility: estimatedIV,
                  theoreticalPrice: option.put.theoreticalPrice,
                  greeks: option.put.greeks,
                },
                formatted.underlying
              );

              enhancedOption.put = {
                ...option.put,
                volatilityAnalysis,
              };
            }

            return enhancedOption;
          }
        );

        setEnhancedOptions(optionsWithVolatilityAnalysis);

        // Identify trading opportunities
        const opportunities = identifyTradingOpportunities(
          optionsWithVolatilityAnalysis
        );
        setTradingOpportunities(opportunities);
      }

      // Reset selection
      setSelectedRow(null);
      setSelectedOptionType(null);
    } catch (err) {
      console.error('Error fetching option chain:', err);
      setError(err.message || 'Failed to fetch option chain data');
    } finally {
      setLoading(false);
    }
  }, [onDataUpdate, selectedExpiry, strikeCount, symbol]);

  useEffect(() => {
    if (symbol) {
      fetchOptionChain();
    }
  }, [fetchOptionChain, symbol]);

  // Check if a strike price is a support or resistance level
  const isSupportResistance = (strike) => {
    if (!supportResistance) return { isSupport: false, isResistance: false };

    const isSupport = supportResistance.support.includes(strike);
    const isResistance = supportResistance.resistance.includes(strike);

    return { isSupport, isResistance };
  };

  // Get trading opportunity data for a specific option
  const getOpportunityData = (strike, type) => {
    const opportunities =
      type === 'call'
        ? tradingOpportunities.callOpportunities
        : tradingOpportunities.putOpportunities;

    return opportunities.find((opp) => opp.strike === strike) || null;
  };

  // Handle option selection
  const handleOptionSelect = (row, optionType) => {
    setSelectedRow(row.strikePrice);
    setSelectedOptionType(optionType);

    // Get the selected option data
    const option = optionType === 'call' ? row.call : row.put;

    // Get the current expiry date
    const expiryDate =
      expiryDates.find((date) => date.value === selectedExpiry)?.label || '';

    // Pass to parent component
    if (onOptionSelect && option) {
      onOptionSelect(option, underlying, expiryDate);
    }
  };

  // Handle form input changes
  const handleSymbolChange = (event) => {
    setSymbol(event.target.value);
  };

  const handleExpiryChange = (event) => {
    setSelectedExpiry(event.target.value);
  };

  const handleStrikeCountChange = (event, newValue) => {
    setStrikeCount(newValue);
  };

  const handleRefresh = () => {
    fetchOptionChain();
  };

  // Format numbers for display
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Format percentage change for display with color
  const formatChange = (change) => {
    if (change === null || change === undefined) return '-';

    const color = change >= 0 ? 'success.main' : 'error.main';
    const prefix = change >= 0 ? '+' : '';

    return (
      <Typography component="span" color={color} fontWeight="medium">
        {prefix}
        {formatNumber(change, 2)}%
      </Typography>
    );
  };

  // Format price difference for display
  const formatPriceDifference = (difference) => {
    if (difference === null || difference === undefined) return null;

    const isOverpriced = difference > 0;
    const color = isOverpriced ? 'error.main' : 'success.main';
    const prefix = isOverpriced ? '+' : '';

    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Typography
          component="span"
          color={color}
          fontWeight="medium"
          fontSize="0.8rem"
        >
          {prefix}
          {formatNumber(difference, 2)}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">Options Chain</Typography>
        <IconButton onClick={handleRefresh} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Controls */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="symbol-select-label">Symbol</InputLabel>
            <Select
              labelId="symbol-select-label"
              id="symbol-select"
              value={symbol}
              label="Symbol"
              onChange={handleSymbolChange}
              disabled={loading}
            >
              {availableSymbols.map((sym) => (
                <MenuItem key={sym.value} value={sym.value}>
                  {sym.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="expiry-select-label">Expiry</InputLabel>
            <Select
              labelId="expiry-select-label"
              id="expiry-select"
              value={selectedExpiry}
              label="Expiry"
              onChange={handleExpiryChange}
              disabled={loading || expiryDates.length === 0}
            >
              {expiryDates.map((date) => (
                <MenuItem key={date.value} value={date.value}>
                  {date.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ px: 2 }}>
            <Typography gutterBottom>Strike Count: {strikeCount}</Typography>
            <Slider
              value={strikeCount}
              onChange={handleStrikeCountChange}
              onChangeCommitted={fetchOptionChain}
              min={1}
              max={20}
              step={1}
              marks={[
                { value: 1, label: '1' },
                { value: 10, label: '10' },
                { value: 20, label: '20' },
              ]}
              disabled={loading}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Support/Resistance Levels */}
      {underlying && supportResistance && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Support Levels:
            </Typography>
            <Stack direction="row" spacing={1}>
              {supportResistance.support.map((level, idx) => (
                <Chip
                  key={idx}
                  label={`₹${formatNumber(level)}`}
                  size="small"
                  color="success"
                  variant={level < underlying.ltp ? 'outlined' : 'filled'}
                />
              ))}
            </Stack>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Resistance Levels:
            </Typography>
            <Stack direction="row" spacing={1}>
              {supportResistance.resistance.map((level, idx) => (
                <Chip
                  key={idx}
                  label={`₹${formatNumber(level)}`}
                  size="small"
                  color="error"
                  variant={level > underlying.ltp ? 'outlined' : 'filled'}
                />
              ))}
            </Stack>
          </Stack>
        </Box>
      )}

      {/* Volatility Information */}
      {impliedVolatility > 0 && (
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                Implied Volatility (IV):{' '}
                <b>{(impliedVolatility * 100).toFixed(1)}%</b>
              </Typography>
              <Typography variant="body2">
                Historical Volatility (HV):{' '}
                <b>{(historicalVolatility * 100).toFixed(1)}%</b>
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              {volatilitySkew && (
                <Box>
                  <Typography variant="body2">
                    IV/HV Ratio: <b>{volatilitySkew.skewRatio.toFixed(2)}</b>
                    <Chip
                      label={
                        volatilitySkew.skewRatio > 1.1
                          ? 'Options Overpriced'
                          : volatilitySkew.skewRatio < 0.9
                          ? 'Options Underpriced'
                          : 'Fair Value'
                      }
                      size="small"
                      color={
                        volatilitySkew.skewRatio > 1.1
                          ? 'error'
                          : volatilitySkew.skewRatio < 0.9
                          ? 'success'
                          : 'default'
                      }
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Typography variant="body2">
                    IV-HV Difference:{' '}
                    <b>{(volatilitySkew.skewDifference * 100).toFixed(1)}%</b>(
                    {volatilitySkew.skewPercentage.toFixed(1)}% of HV)
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Trading Opportunities Summary */}
      {(tradingOpportunities.callOpportunities.length > 0 ||
        tradingOpportunities.putOpportunities.length > 0) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Trading Opportunities:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              {tradingOpportunities.callOpportunities.length > 0 ? (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {tradingOpportunities.callOpportunities
                    .slice(0, 3)
                    .map((opp, idx) => (
                      <Chip
                        key={idx}
                        label={`${opp.action} ${opp.strike} CE`}
                        size="small"
                        color={opp.action === 'BUY' ? 'success' : 'error'}
                        icon={
                          opp.action === 'BUY' ? (
                            <ArrowUpwardIcon />
                          ) : (
                            <ArrowDownwardIcon />
                          )
                        }
                      />
                    ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No call opportunities
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {tradingOpportunities.putOpportunities.length > 0 ? (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {tradingOpportunities.putOpportunities
                    .slice(0, 3)
                    .map((opp, idx) => (
                      <Chip
                        key={idx}
                        label={`${opp.action} ${opp.strike} PE`}
                        size="small"
                        color={opp.action === 'BUY' ? 'success' : 'error'}
                        icon={
                          opp.action === 'BUY' ? (
                            <ArrowUpwardIcon />
                          ) : (
                            <ArrowDownwardIcon />
                          )
                        }
                      />
                    ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No put opportunities
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Underlying asset info */}
      {underlying && (
        <Box sx={{ mb: 3, p: 2, borderRadius: 1, bgcolor: 'background.paper' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="primary">
                {underlying.description} ({underlying.ex_symbol})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {underlying.exchange}:{underlying.ex_symbol}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: { xs: 'flex-start', md: 'flex-end' },
                  gap: 3,
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    LTP
                  </Typography>
                  <Typography variant="h6">
                    ₹{formatNumber(underlying.ltp)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Change
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6">
                      {formatChange(underlying.ltpchp)}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({underlying.ltpch > 0 ? '+' : ''}
                      {formatNumber(underlying.ltpch)})
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Option chain table */}
      {!loading && enhancedOptions.length > 0 && (
        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  align="center"
                  colSpan={7}
                  sx={{ bgcolor: 'primary.light', color: 'white' }}
                >
                  CALLS
                </TableCell>
                <TableCell
                  align="center"
                  rowSpan={2}
                  sx={{ bgcolor: 'grey.300' }}
                >
                  Strike Price
                </TableCell>
                <TableCell
                  align="center"
                  colSpan={7}
                  sx={{ bgcolor: 'primary.light', color: 'white' }}
                >
                  PUTS
                </TableCell>
              </TableRow>
              <TableRow>
                {/* Call Headers */}
                <TableCell align="right">OI</TableCell>
                <TableCell align="right">Chg%</TableCell>
                <TableCell align="right">Volume</TableCell>
                <TableCell align="right">IV/HV</TableCell>
                <TableCell align="right">LTP</TableCell>
                <TableCell align="right">Theo.</TableCell>
                <TableCell align="right">Diff</TableCell>

                {/* Put Headers */}
                <TableCell align="right">Diff</TableCell>
                <TableCell align="right">Theo.</TableCell>
                <TableCell align="right">LTP</TableCell>
                <TableCell align="right">IV/HV</TableCell>
                <TableCell align="right">Volume</TableCell>
                <TableCell align="right">Chg%</TableCell>
                <TableCell align="right">OI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enhancedOptions.map((row) => {
                // Calculate ATM/ITM/OTM status
                const atmStrike = underlying?.ltp
                  ? Math.abs(row.strikePrice - underlying.ltp) <
                    underlying.ltp * 0.005
                  : false;

                const callITM =
                  underlying?.ltp && row.strikePrice < underlying.ltp;
                const putITM =
                  underlying?.ltp && row.strikePrice > underlying.ltp;

                // Check if this row is selected
                const isSelected = row.strikePrice === selectedRow;

                // Check if this strike is a support or resistance level
                const { isSupport, isResistance } = isSupportResistance(
                  row.strikePrice
                );

                // Get trading opportunities
                const callOpportunity = row.call
                  ? getOpportunityData(row.strikePrice, 'call')
                  : null;
                const putOpportunity = row.put
                  ? getOpportunityData(row.strikePrice, 'put')
                  : null;

                // Get volatility analysis for options
                const callVolatility = row.call?.volatilityAnalysis;
                const putVolatility = row.put?.volatilityAnalysis;

                // Determine row background color based on support/resistance
                let rowBgColor = '';
                if (isSelected) {
                  rowBgColor = 'rgba(25, 118, 210, 0.08)';
                } else if (atmStrike) {
                  rowBgColor = 'rgba(255, 236, 179, 0.4)';
                } else if (isSupport) {
                  rowBgColor = 'rgba(129, 199, 132, 0.15)';
                } else if (isResistance) {
                  rowBgColor = 'rgba(229, 115, 115, 0.15)';
                } else if (row.strikePrice % 2 === 0) {
                  rowBgColor = 'rgba(0, 0, 0, 0.02)';
                }

                return (
                  <TableRow
                    key={row.strikePrice}
                    sx={{
                      backgroundColor: rowBgColor,
                      position: 'relative',
                    }}
                  >
                    {/* Call Columns */}
                    <TableCell
                      align="right"
                      sx={{
                        backgroundColor: callITM
                          ? 'rgba(200, 230, 201, 0.3)'
                          : 'transparent',
                      }}
                    >
                      {row.call?.oi ? formatNumber(row.call.oi, 0) : '-'}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        backgroundColor: callITM
                          ? 'rgba(200, 230, 201, 0.3)'
                          : 'transparent',
                      }}
                    >
                      {row.call?.oichp ? formatChange(row.call.oichp) : '-'}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        backgroundColor: callITM
                          ? 'rgba(200, 230, 201, 0.3)'
                          : 'transparent',
                      }}
                    >
                      {row.call?.volume
                        ? formatNumber(row.call.volume, 0)
                        : '-'}
                    </TableCell>

                    {/* Call IV/HV Ratio */}
                    <TableCell
                      align="right"
                      sx={{
                        backgroundColor: callITM
                          ? 'rgba(200, 230, 201, 0.3)'
                          : 'transparent',
                        color:
                          callVolatility?.skewRatio > 1.1
                            ? 'error.main'
                            : callVolatility?.skewRatio < 0.9
                            ? 'success.main'
                            : 'text.secondary',
                        fontWeight: 'medium',
                      }}
                    >
                      {callVolatility
                        ? callVolatility.skewRatio.toFixed(2)
                        : '-'}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        backgroundColor: callITM
                          ? 'rgba(200, 230, 201, 0.3)'
                          : 'transparent',
                        fontWeight: 'medium',
                        cursor: row.call ? 'pointer' : 'default',
                        ...(isSelected && selectedOptionType === 'call'
                          ? {
                              backgroundColor: 'rgba(76, 175, 80, 0.2)',
                              fontWeight: 'bold',
                            }
                          : {}),
                        ...(callOpportunity
                          ? {
                              backgroundColor:
                                callOpportunity.action === 'BUY'
                                  ? 'rgba(76, 175, 80, 0.3)'
                                  : 'rgba(244, 67, 54, 0.3)',
                            }
                          : {}),
                      }}
                      onClick={() =>
                        row.call && handleOptionSelect(row, 'call')
                      }
                    >
                      {row.call?.ltp ? (
                        <Tooltip
                          title={
                            callOpportunity || callVolatility?.tradingSignal
                              ? `${
                                  callOpportunity?.action ||
                                  callVolatility?.tradingSignal
                                } opportunity - ${Math.abs(
                                  row.call.percentDifference ||
                                    callVolatility?.skewPercentage ||
                                    0
                                ).toFixed(1)}% ${
                                  row.call.percentDifference > 0 ||
                                  callVolatility?.skewRatio > 1
                                    ? 'overpriced'
                                    : 'underpriced'
                                }`
                              : ''
                          }
                          arrow
                          placement="top"
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                            }}
                          >
                            {(callOpportunity?.action === 'BUY' ||
                              callVolatility?.tradingSignal === 'BUY' ||
                              callVolatility?.tradingSignal ===
                                'NEUTRAL_BUY') && (
                              <ArrowUpwardIcon
                                fontSize="small"
                                color="success"
                                sx={{ mr: 0.5 }}
                              />
                            )}
                            {(callOpportunity?.action === 'SELL' ||
                              callVolatility?.tradingSignal === 'SELL' ||
                              callVolatility?.tradingSignal ===
                                'NEUTRAL_SELL') && (
                              <ArrowDownwardIcon
                                fontSize="small"
                                color="error"
                                sx={{ mr: 0.5 }}
                              />
                            )}
                            {formatNumber(row.call.ltp, 2)}
                          </Box>
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        backgroundColor: callITM
                          ? 'rgba(200, 230, 201, 0.3)'
                          : 'transparent',
                        color: 'text.secondary',
                      }}
                    >
                      {row.call?.theoreticalPrice
                        ? formatNumber(row.call.theoreticalPrice, 2)
                        : '-'}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        backgroundColor: callITM
                          ? 'rgba(200, 230, 201, 0.3)'
                          : 'transparent',
                      }}
                    >
                      {row.call?.priceDifference
                        ? formatPriceDifference(row.call.priceDifference)
                        : '-'}
                    </TableCell>

                    {/* Strike Price */}
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(0, 0, 0, 0.08)',
                        position: 'relative',
                      }}
                    >
                      {formatNumber(row.strikePrice, 0)}
                      {(isSupport || isResistance) && (
                        <Chip
                          label={isSupport ? 'S' : 'R'}
                          size="small"
                          color={isSupport ? 'success' : 'error'}
                          sx={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            height: '16px',
                            minWidth: '16px',
                            fontSize: '0.6rem',
                          }}
                        />
                      )}
                    </TableCell>

                    {/* Put Columns */}
                    <TableCell
                      align="center"
                      sx={{
                        backgroundColor: putITM
                          ? 'rgba(200, 230, 201, 0.3)'
                          : 'transparent',
                      }}
                    >
                      {row.put?.priceDifference
                        ? formatPriceDifference(row.put.priceDifference)
                        : '-'}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        backgroundColor: putITM
                          ? 'rgba(200, 230, 201, 0.3)'
                          : 'transparent',
                        color: 'text.secondary',
                      }}
                    >
                      {row.put?.theoreticalPrice
                        ? formatNumber(row.put.theoreticalPrice, 2)
                        : '-'}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        backgroundColor: putITM
                          ? 'rgba(200, 230, 201, 0.3)'
                          : 'transparent',
                        fontWeight: 'medium',
                        cursor: row.put ? 'pointer' : 'default',
                        ...(isSelected && selectedOptionType === 'put'
                          ? {
                              backgroundColor: 'rgba(76, 175, 80, 0.2)',
                              fontWeight: 'bold',
                            }
                          : {}),
                        ...(putOpportunity
                          ? {
                              backgroundColor:
                                putOpportunity.action === 'BUY'
                                  ? 'rgba(76, 175, 80, 0.3)'
                                  : 'rgba(244, 67, 54, 0.3)',
                            }
                          : {}),
                      }}
                      onClick={() => row.put && handleOptionSelect(row, 'put')}
                    >
                      {row.put?.ltp ? (
                        <Tooltip
                          title={
                            putOpportunity || putVolatility?.tradingSignal
                              ? `${
                                  putOpportunity?.action ||
                                  putVolatility?.tradingSignal
                                } opportunity - ${Math.abs(
                                  row.put.percentDifference ||
                                    putVolatility?.skewPercentage ||
                                    0
                                ).toFixed(1)}% ${
                                  row.put.percentDifference > 0 ||
                                  putVolatility?.skewRatio > 1
                                    ? 'overpriced'
                                    : 'underpriced'
                                }`
                              : ''
                          }
                          arrow
                          placement="top"
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                            }}
                          >
                            {(putOpportunity?.action === 'BUY' ||
                              putVolatility?.tradingSignal === 'BUY' ||
                              putVolatility?.tradingSignal ===
                                'NEUTRAL_BUY') && (
                              <ArrowUpwardIcon
                                fontSize="small"
                                color="success"
                                sx={{ mr: 0.5 }}
                              />
                            )}
                            {(putOpportunity?.action === 'SELL' ||
                              putVolatility?.tradingSignal === 'SELL' ||
                              putVolatility?.tradingSignal ===
                                'NEUTRAL_SELL') && (
                              <ArrowDownwardIcon
                                fontSize="small"
                                color="error"
                                sx={{ mr: 0.5 }}
                              />
                            )}
                            {formatNumber(row.put.ltp, 2)}
                          </Box>
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>

                    {/* Put IV/HV Ratio */}
                    <TableCell
                      align="right"
                      sx={{
                        backgroundColor: putITM
                          ? 'rgba(200, 230, 201, 0.3)'
                          : 'transparent',
                        color:
                          putVolatility?.skewRatio > 1.1
                            ? 'error.main'
                            : putVolatility?.skewRatio < 0.9
                            ? 'success.main'
                            : 'text.secondary',
                        fontWeight: 'medium',
                      }}
                    >
                      {putVolatility ? putVolatility.skewRatio.toFixed(2) : '-'}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        backgroundColor: putITM
                          ? 'rgba(200, 230, 201, 0.3)'
                          : 'transparent',
                      }}
                    >
                      {row.put?.volume ? formatNumber(row.put.volume, 0) : '-'}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        backgroundColor: putITM
                          ? 'rgba(200, 230, 201, 0.3)'
                          : 'transparent',
                      }}
                    >
                      {row.put?.oichp ? formatChange(row.put.oichp) : '-'}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        backgroundColor: putITM
                          ? 'rgba(200, 230, 201, 0.3)'
                          : 'transparent',
                      }}
                    >
                      {row.put?.oi ? formatNumber(row.put.oi, 0) : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Empty state */}
      {!loading && enhancedOptions.length === 0 && !error && (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography>
            No options data available. Please select a symbol and fetch data.
          </Typography>
        </Box>
      )}

      {/* Legend */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          borderRadius: 1,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" gutterBottom>
              Price Analysis:
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    backgroundColor: 'rgba(76, 175, 80, 0.3)',
                    mr: 1,
                  }}
                />
                <Typography variant="body2">Buy Signal</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    backgroundColor: 'rgba(244, 67, 54, 0.3)',
                    mr: 1,
                  }}
                />
                <Typography variant="body2">Sell Signal</Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" gutterBottom>
              Support/Resistance:
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    backgroundColor: 'rgba(129, 199, 132, 0.15)',
                    mr: 1,
                  }}
                />
                <Typography variant="body2">Support Level</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    backgroundColor: 'rgba(229, 115, 115, 0.15)',
                    mr: 1,
                  }}
                />
                <Typography variant="body2">Resistance Level</Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" gutterBottom>
              IV/HV Ratio:
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="success.main" sx={{ mr: 1 }}>
                  {'<0.9'}
                </Typography>
                <Typography variant="body2">Underpriced</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="error.main" sx={{ mr: 1 }}>
                  {'>1.1'}
                </Typography>
                <Typography variant="body2">Overpriced</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Summary */}
      {optionChainData && (
        <Box sx={{ mt: 2, p: 2, borderRadius: 1, bgcolor: 'background.paper' }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Total Call OI:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatNumber(optionChainData.callOi || 0, 0)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Total Put OI:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatNumber(optionChainData.putOi || 0, 0)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Put-Call Ratio (OI):
              </Typography>
              <Typography
                variant="body1"
                fontWeight="medium"
                color={
                  optionChainData.putOi &&
                  optionChainData.callOi &&
                  optionChainData.putOi / optionChainData.callOi > 1.2
                    ? 'error.main'
                    : optionChainData.putOi &&
                      optionChainData.callOi &&
                      optionChainData.putOi / optionChainData.callOi < 0.8
                    ? 'success.main'
                    : 'text.primary'
                }
              >
                {optionChainData.putOi && optionChainData.callOi
                  ? (optionChainData.putOi / optionChainData.callOi).toFixed(2)
                  : '-'}
              </Typography>
            </Grid>

            {optionChainData.indiavixData && (
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  India VIX:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" fontWeight="medium">
                    {formatNumber(optionChainData.indiavixData.ltp, 2)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ ml: 1 }}
                    color={
                      optionChainData.indiavixData.ltpchp >= 0
                        ? 'success.main'
                        : 'error.main'
                    }
                  >
                    ({optionChainData.indiavixData.ltpchp >= 0 ? '+' : ''}
                    {formatNumber(optionChainData.indiavixData.ltpchp, 2)}%)
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default OptionChain;
