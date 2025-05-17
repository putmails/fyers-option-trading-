import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import useOptionStore from '../../../store/option-store';
import { formatNumber } from '../../../utils/common.utils';

/**
 * Component displaying summary statistics for the option chain
 */
const ChainSummary = React.memo(() => {

  const { optionChainData: {formattedData} } = useOptionStore();
  if (!formattedData) return null;
  
  return (
    <Box sx={{ mt: 2, p: 2, borderRadius: 1, bgcolor: 'background.paper' }}>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Total Call OI:</Typography>
          <Typography variant="body1" fontWeight="medium">
            {formatNumber(formattedData.callOi || 0, 0)}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Total Put OI:</Typography>
          <Typography variant="body1" fontWeight="medium">
            {formatNumber(formattedData.putOi || 0, 0)}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Put-Call Ratio (OI):</Typography>
          <Typography 
            variant="body1" 
            fontWeight="medium"
            color={
              formattedData.putOi && formattedData.callOi && 
              (formattedData.putOi / formattedData.callOi) > 1.2 ? 'error.main' : 
              formattedData.putOi && formattedData.callOi && 
              (formattedData.putOi / formattedData.callOi) < 0.8 ? 'success.main' : 
              'text.primary'
            }
          >
            {formattedData.putOi && formattedData.callOi ? 
              (formattedData.putOi / formattedData.callOi).toFixed(2) : 
              '-'
            }
          </Typography>
        </Grid>
        
        {formattedData.indiavixData && (
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">India VIX:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" fontWeight="medium">
                {formatNumber(formattedData.indiavixData.ltp, 2)}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ ml: 1 }}
                color={formattedData.indiavixData.ltpchp >= 0 ? 'success.main' : 'error.main'}
              >
                ({formattedData.indiavixData.ltpchp >= 0 ? '+' : ''}
                {formatNumber(formattedData.indiavixData.ltpchp, 2)}%)
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
});

export default ChainSummary;