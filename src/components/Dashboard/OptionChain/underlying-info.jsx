import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { formatNumber } from '../../../utils/common.utils';
import useOptionStore from '../../../store/option-store';
import { ChangeFormat } from './format-change';

/**
 * Component to display underlying asset information
 */
const UnderlyingInfo = () => {

  const { underlying} = useOptionStore();
  if (!underlying) return null;
  
  return (
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
                  <ChangeFormat change={underlying.ltpchp} />
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
  );
};

export default UnderlyingInfo;