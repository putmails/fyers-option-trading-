import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import useOptionStore from '../../../store/option-store';
import { formatNumber } from '../../../utils/common.utils';

/**
 * Component displaying summary statistics for the option chain
 */
const ChainSummary = React.memo(() => {

  const { optionChainData } = useOptionStore();
  if (!optionChainData) return null;
  
  return (
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
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Put-Call Ratio (OI):</Typography>
          <Typography 
            variant="body1" 
            fontWeight="medium"
            color={
              optionChainData.putOi && optionChainData.callOi && 
              (optionChainData.putOi / optionChainData.callOi) > 1.2 ? 'error.main' : 
              optionChainData.putOi && optionChainData.callOi && 
              (optionChainData.putOi / optionChainData.callOi) < 0.8 ? 'success.main' : 
              'text.primary'
            }
          >
            {optionChainData.putOi && optionChainData.callOi ? 
              (optionChainData.putOi / optionChainData.callOi).toFixed(2) : 
              '-'
            }
          </Typography>
        </Grid>
        
        {optionChainData.indiavixData && (
          <Grid item xs={6}>
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
  );
});

export default ChainSummary;