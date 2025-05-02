import React from 'react';
import { Box, Grid, Typography, Stack } from '@mui/material';

/**
 * Component displaying the legend for color codes and indicators
 */
const Legend = () => (
  <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <Typography variant="subtitle2" gutterBottom>Price Analysis:</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: 'rgba(76, 175, 80, 0.3)', mr: 1 }} />
            <Typography variant="body2">Buy Signal</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: 'rgba(244, 67, 54, 0.3)', mr: 1 }} />
            <Typography variant="body2">Sell Signal</Typography>
          </Box>
        </Stack>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Typography variant="subtitle2" gutterBottom>Support/Resistance:</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: 'rgba(129, 199, 132, 0.15)', mr: 1 }} />
            <Typography variant="body2">Support Level</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: 'rgba(229, 115, 115, 0.15)', mr: 1 }} />
            <Typography variant="body2">Resistance Level</Typography>
          </Box>
        </Stack>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Typography variant="subtitle2" gutterBottom>IV/HV Ratio:</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="success.main" sx={{ mr: 1 }}>{"<0.9"}</Typography>
            <Typography variant="body2">Underpriced</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="error.main" sx={{ mr: 1 }}>{">1.1"}</Typography>
            <Typography variant="body2">Overpriced</Typography>
          </Box>
        </Stack>
      </Grid>
    </Grid>
  </Box>
);

export default Legend;