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
  TextField,
  Stack,
  Grid,
  Divider,
  CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { 
  getOptionChainData, 
  getAvailableSymbols, 
  formatOptionChainData 
} from '../../services/fyers-option-chain-service';

const OptionChain = () => {
  // State for form controls
  const [symbol, setSymbol] = useState('NSE:TCS-EQ');
  const [strikeCount, setStrikeCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for option chain data
  const [availableSymbols, setAvailableSymbols] = useState([]);
  const [expiryDates, setExpiryDates] = useState([]);
  const [selectedExpiry, setSelectedExpiry] = useState('');
  const [optionChainData, setOptionChainData] = useState(null);
  const [underlying, setUnderlying] = useState(null);
  const [options, setOptions] = useState([]);

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

  // Fetch option chain data
  const fetchOptionChain = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getOptionChainData(symbol, strikeCount);
      console.log("🚀 ~ fetchOptionChain ~ data:", data)
      const formatted = formatOptionChainData(data);
      
      setUnderlying(formatted.underlying);
      setOptions(formatted.options);
      setExpiryDates(formatted.expiryDates);
      
      if (formatted.expiryDates.length > 0 && !selectedExpiry) {
        setSelectedExpiry(formatted.expiryDates[0].value);
      }
      
      setOptionChainData(data); // Store raw data
    } catch (err) {
      console.error('Error fetching option chain:', err);
      setError(err.message || 'Failed to fetch option chain data');
    } finally {
      setLoading(false);
    }
  },[selectedExpiry, strikeCount, symbol]);

  // Fetch data when component mounts or symbol changes
  useEffect(() => {
    if (symbol) {
      fetchOptionChain();
    }
  }, [fetchOptionChain, symbol]);

  // Handle form input changes
  const handleSymbolChange = (event) => {
    console.log("🚀 ~ handleSymbolChange ~ event:", event.target.value)
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
      maximumFractionDigits: decimals
    });
  };

  // Format percentage change for display with color
  const formatChange = (change) => {
    if (change === null || change === undefined) return '-';
    
    const color = change >= 0 ? 'success.main' : 'error.main';
    const prefix = change >= 0 ? '+' : '';
    
    return (
      <Typography component="span" color={color} fontWeight="medium">
        {prefix}{formatNumber(change, 2)}%
      </Typography>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <MenuItem key={sym.value} value={sym.value}>{sym.label}</MenuItem>
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
                <MenuItem key={date.value} value={date.value}>{date.label}</MenuItem>
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
                { value: 20, label: '20' }
              ]}
              disabled={loading}
            />
          </Box>
        </Grid>
      </Grid>
      
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
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">LTP</Typography>
                  <Typography variant="h6">₹{formatNumber(underlying.ltp)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Change</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6">
                      {formatChange(underlying.ltpchp)}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({underlying.ltpch > 0 ? '+' : ''}{formatNumber(underlying.ltpch)})
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
      {!loading && options.length > 0 && (
        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center" colSpan={5} sx={{ bgcolor: 'primary.light', color: 'white' }}>
                  CALLS
                </TableCell>
                <TableCell align="center" rowSpan={2} sx={{ bgcolor: 'grey.300' }}>
                  Strike Price
                </TableCell>
                <TableCell align="center" colSpan={5} sx={{ bgcolor: 'primary.light', color: 'white' }}>
                  PUTS
                </TableCell>
              </TableRow>
              <TableRow>
                {/* Call Headers */}
                <TableCell align="right">OI</TableCell>
                <TableCell align="right">Chg%</TableCell>
                <TableCell align="right">Volume</TableCell>
                <TableCell align="right">LTP</TableCell>
                <TableCell align="right">Chg%</TableCell>
                
                {/* Put Headers */}
                <TableCell align="right">Chg%</TableCell>
                <TableCell align="right">LTP</TableCell>
                <TableCell align="right">Volume</TableCell>
                <TableCell align="right">Chg%</TableCell>
                <TableCell align="right">OI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {options.map((row) => {
                // Calculate ATM/ITM/OTM status
                const atmStrike = underlying?.ltp ? (
                  Math.abs(row.strikePrice - underlying.ltp) < (underlying.ltp * 0.005)
                ) : false;
                
                const callITM = underlying?.ltp && row.strikePrice < underlying.ltp;
                const putITM = underlying?.ltp && row.strikePrice > underlying.ltp;
                
                return (
                  <TableRow 
                    key={row.strikePrice}
                    sx={{ 
                      '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                      ...(atmStrike ? { backgroundColor: 'rgba(255, 236, 179, 0.4)' } : {})
                    }}
                  >
                    {/* Call Columns */}
                    <TableCell 
                      align="right"
                      sx={{ 
                        backgroundColor: callITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent'
                      }}
                    >
                      {row.call?.oi ? formatNumber(row.call.oi, 0) : '-'}
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        backgroundColor: callITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent'
                      }}
                    >
                      {row.call?.oichp ? formatChange(row.call.oichp) : '-'}
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        backgroundColor: callITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent'
                      }}
                    >
                      {row.call?.volume ? formatNumber(row.call.volume, 0) : '-'}
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        backgroundColor: callITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
                        fontWeight: 'medium'
                      }}
                    >
                      {row.call?.ltp ? formatNumber(row.call.ltp, 2) : '-'}
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        backgroundColor: callITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent'
                      }}
                    >
                      {row.call?.ltpchp ? formatChange(row.call.ltpchp) : '-'}
                    </TableCell>
                    
                    {/* Strike Price */}
                    <TableCell 
                      align="center"
                      sx={{ 
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      {formatNumber(row.strikePrice, 0)}
                    </TableCell>
                    
                    {/* Put Columns */}
                    <TableCell 
                      align="right"
                      sx={{ 
                        backgroundColor: putITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent'
                      }}
                    >
                      {row.put?.ltpchp ? formatChange(row.put.ltpchp) : '-'}
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        backgroundColor: putITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
                        fontWeight: 'medium'
                      }}
                    >
                      {row.put?.ltp ? formatNumber(row.put.ltp, 2) : '-'}
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        backgroundColor: putITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent'
                      }}
                    >
                      {row.put?.volume ? formatNumber(row.put.volume, 0) : '-'}
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        backgroundColor: putITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent'
                      }}
                    >
                      {row.put?.oichp ? formatChange(row.put.oichp) : '-'}
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        backgroundColor: putITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent'
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
      {!loading && options.length === 0 && !error && (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography>No options data available. Please select a symbol and fetch data.</Typography>
        </Box>
      )}
      
      {/* Summary */}
      {optionChainData && (
        <Box sx={{ mt: 2, p: 2, borderRadius: 1, bgcolor: 'background.paper' }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Total Call OI:</Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatNumber(optionChainData.callOi || 0, 0)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Total Put OI:</Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatNumber(optionChainData.putOi || 0, 0)}
              </Typography>
            </Grid>
            {optionChainData.indiavixData && (
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary">India VIX:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" fontWeight="medium">
                    {formatNumber(optionChainData.indiavixData.ltp, 2)}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ ml: 1 }}
                    color={optionChainData.indiavixData.ltpchp >= 0 ? 'success.main' : 'error.main'}
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