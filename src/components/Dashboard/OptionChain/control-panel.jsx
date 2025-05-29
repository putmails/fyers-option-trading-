import React, { useCallback } from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Slider,
} from '@mui/material';
import useOptionStore from '../../../store/option-store';
import { availableOptions } from '../../../utils/constant';

/**
 * Input controls for the option chain
 */
const ControlPanel = React.memo(() => {
  const {
    selectedSymbol,
    expiryDates,
    selectedExpiry,
    // strikeCount,
    isLoading,
    setSelectedSymbol,
    setSelectedExpiry,
    // setStrikeCount,
  } = useOptionStore();

  const handleSelectSymbol = useCallback((event) => {
    setSelectedSymbol(event.target.value);
  }, [setSelectedSymbol]);

  const handleSelectExpiry = useCallback((event) => {
    const selectedDateValue =event.target.value;
    const selectedDate = expiryDates.find(date => date.label === selectedDateValue)
    setSelectedExpiry(selectedDate);
  }, [expiryDates, setSelectedExpiry]);

  if (availableOptions.length === 0) return null;
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} md={4}>
        <FormControl fullWidth size="small">
          <InputLabel id="symbol-select-label">Symbol</InputLabel>
          <Select
            labelId="symbol-select-label"
            id="symbol-select"
            value={selectedSymbol}
            label="Symbol"
            onChange={handleSelectSymbol}
            disabled={isLoading}
          >
            {availableOptions.map((sym) => (
              <MenuItem key={sym.value} value={sym.value}>
                {sym.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth size="small">
          <InputLabel id="expiry-select-label" className='w-fit'>Expiry</InputLabel>
          <Select
            labelId="expiry-select-label"
            id="expiry-select"
            value={selectedExpiry.label}
            label="Expiry"
            onChange={handleSelectExpiry}
            disabled={isLoading || expiryDates.length === 0}
          >
            {expiryDates.map((date) => (
              <MenuItem key={date.value} value={date.label}>
                {date.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* <Grid item xs={12} md={4}>
        <Box sx={{ px: 2 }}>
          <Typography gutterBottom>Strike Count: {strikeCount}</Typography>
          <Slider
            value={strikeCount}
            onChange={setStrikeCount}
            disableSwap
            // onChangeCommitted={fetchOptionChain}
            min={1}
            max={20}
            step={1}
            marks={[
              { value: 1, label: '1' },
              { value: 10, label: '10' },
              { value: 20, label: '20' },
            ]}
            disabled={isLoading}
          />
        </Box>
      </Grid> */}
    </Grid>
  );
});

export default ControlPanel;
