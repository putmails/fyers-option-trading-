import React from 'react';
import { Box, Stack, Typography, Chip } from '@mui/material';
import useOptionStore from '../../../store/option-store';
import { formatNumber } from '../../../utils/common.utils';

/**
 * Displays support and resistance levels
 */
const SupportResistanceDisplay = React.memo(() => {
  const { supportResistance, underlying } = useOptionStore();
  if (!supportResistance || !underlying) return null;
  
  return (
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
              variant={level < underlying.ltp ? "outlined" : "filled"}
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
              variant={level > underlying.ltp ? "outlined" : "filled"}
            />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
});

export default SupportResistanceDisplay;