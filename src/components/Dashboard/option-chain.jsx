import React, { useState } from 'react';
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
  MenuItem
} from '@mui/material';

// Mock data for options chain
const mockOptionsData = [
  { strike: 18000, callOI: 1500, callLTP: 150.5, putLTP: 120.75, putOI: 1200 },
  { strike: 18100, callOI: 1300, callLTP: 120.25, putLTP: 140.5, putOI: 1400 },
  { strike: 18200, callOI: 1100, callLTP: 100.5, putLTP: 160.25, putOI: 1600 },
  { strike: 18300, callOI: 900, callLTP: 80.75, putLTP: 180.5, putOI: 1800 },
  { strike: 18400, callOI: 700, callLTP: 60.25, putLTP: 200.75, putOI: 2000 },
  { strike: 18500, callOI: 500, callLTP: 40.5, putLTP: 220.25, putOI: 2200 }
];

const OptionChain = () => {
  const [symbol, setSymbol] = useState('NIFTY');
  const [expiry, setExpiry] = useState('25APR2025');

  // Symbols and expiry dates would typically come from API
  const symbols = ['NIFTY', 'BANKNIFTY', 'FINNIFTY'];
  const expiryDates = ['25APR2025', '02MAY2025', '09MAY2025'];

  const handleSymbolChange = (event) => {
    setSymbol(event.target.value);
  };

  const handleExpiryChange = (event) => {
    setExpiry(event.target.value);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Options Chain
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel id="symbol-select-label">Symbol</InputLabel>
          <Select
            labelId="symbol-select-label"
            id="symbol-select"
            value={symbol}
            label="Symbol"
            onChange={handleSymbolChange}
          >
            {symbols.map((sym) => (
              <MenuItem key={sym} value={sym}>{sym}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel id="expiry-select-label">Expiry</InputLabel>
          <Select
            labelId="expiry-select-label"
            id="expiry-select"
            value={expiry}
            label="Expiry"
            onChange={handleExpiryChange}
          >
            {expiryDates.map((date) => (
              <MenuItem key={date} value={date}>{date}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center" colSpan={2}>CALLS</TableCell>
              <TableCell align="center" rowSpan={2}>Strike Price</TableCell>
              <TableCell align="center" colSpan={2}>PUTS</TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="right">OI</TableCell>
              <TableCell align="right">LTP</TableCell>
              <TableCell align="right">LTP</TableCell>
              <TableCell align="right">OI</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockOptionsData.map((row) => (
              <TableRow 
                key={row.strike}
                sx={{ 
                  '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                }}
              >
                <TableCell align="right">{row.callOI.toLocaleString()}</TableCell>
                <TableCell align="right">{row.callLTP.toFixed(2)}</TableCell>
                <TableCell 
                  align="center"
                  sx={{ 
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(0, 0, 0, 0.08)'
                  }}
                >
                  {row.strike.toLocaleString()}
                </TableCell>
                <TableCell align="right">{row.putLTP.toFixed(2)}</TableCell>
                <TableCell align="right">{row.putOI.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
        * Data shown is simulated. Real data would be fetched from Fyers API.
      </Typography>
    </Box>
  );
};

export default OptionChain;
