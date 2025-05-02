import React from 'react';
import { Box, Grid, Typography, Chip } from '@mui/material';
import useOptionStore from '../../../store/option-store';

/**
 * Component displaying volatility metrics
 */
const VolatilityInfo = () => {
  const {
    volatilityData: { impliedVolatility, historicalVolatility, volatilitySkew },
  } = useOptionStore();
  if (impliedVolatility <= 0) return null;

  return (
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
  );
};

export default VolatilityInfo;
