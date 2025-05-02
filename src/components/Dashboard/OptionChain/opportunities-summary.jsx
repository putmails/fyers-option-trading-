import React from 'react';
import { Box, Grid, Typography, Stack, Chip } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

/**
 * Component to display trading opportunities summary
 */
const OpportunitiesSummary = ({ tradingOpportunities }) => {
  if (!tradingOpportunities || 
      (tradingOpportunities.callOpportunities.length === 0 && 
       tradingOpportunities.putOpportunities.length === 0)) {
    return null;
  }
  
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom>
        Trading Opportunities:
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {tradingOpportunities.callOpportunities.length > 0 ? (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {tradingOpportunities.callOpportunities.slice(0, 3).map((opp, idx) => (
                <Chip
                  key={idx}
                  label={`${opp.action} ${opp.strike} CE`}
                  size="small"
                  color={opp.action === 'BUY' ? 'success' : 'error'}
                  icon={opp.action === 'BUY' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">No call opportunities</Typography>
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          {tradingOpportunities.putOpportunities.length > 0 ? (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {tradingOpportunities.putOpportunities.slice(0, 3).map((opp, idx) => (
                <Chip
                  key={idx}
                  label={`${opp.action} ${opp.strike} PE`}
                  size="small"
                  color={opp.action === 'BUY' ? 'success' : 'error'}
                  icon={opp.action === 'BUY' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">No put opportunities</Typography>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default OpportunitiesSummary;