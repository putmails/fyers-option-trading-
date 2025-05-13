import React from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Box,
  Grid,
  Typography,
  Paper,
} from '@mui/material';
import { OptionRow } from './index';

/**
 * Component displaying the option chain data table
 */
const OptionsTable = ({
  enhancedOptions,
  underlying,
  selectedRow,
  selectedOptionType,
  isSupportResistance,
  getOpportunityData,
  handleOptionSelect,
  formatNumber,
  formatChange,
  formatPriceDifference,
  selectedExpiry,
}) => {
  if (!enhancedOptions || enhancedOptions.length === 0) return null;

  return (
    <>
    <Box sx={{ mb: 2 }}>
      {/* Index Name, Expiry Date, and Strike Price */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Typography variant="body2">
            Index: <b>{underlying.symbol}</b>
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="body2">
            Expiry: <b>{selectedExpiry.label || 'N/A'}</b>
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="body2">
            Strike: <b>{underlying?.ltp || 'N/A'}</b>
          </Typography>
        </Grid>
      </Grid>
    </Box>
    <TableContainer component={Paper} sx={{ maxHeight: 900 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell
              align="center"
              colSpan={7}
              sx={{ bgcolor: 'primary.light', color: 'white' }}
            >
              CALLS
            </TableCell>
            <TableCell align="center" rowSpan={1} sx={{ bgcolor: 'grey.300' }} colSpan={3}>
              Strike Price
            </TableCell>
            <TableCell
              align="center"
              colSpan={7}
              sx={{ bgcolor: 'primary.light', color: 'white' }}
            >
              PUTS
            </TableCell>
          </TableRow>
          <TableRow>
            {/* Call Headers */}
            <TableCell align="right">OI</TableCell>
            <TableCell align="right">Chg%</TableCell>
            <TableCell align="right">Volume</TableCell>
            <TableCell align="right">IV/HV</TableCell>
            <TableCell align="right">LTP</TableCell>
            <TableCell align="right">Theo.</TableCell>
            <TableCell align="right">Diff (%)</TableCell>
            <TableCell align="right">Strike Price</TableCell>
            <TableCell align="center">Parity Diff</TableCell>
            <TableCell align="right">Strike Price</TableCell>

            {/* Put Headers */}
            <TableCell align="right">Diff (%)</TableCell>
            <TableCell align="right">Theo.</TableCell>
            <TableCell align="right">LTP</TableCell>
            <TableCell align="right">IV/HV</TableCell>
            <TableCell align="right">Volume</TableCell>
            <TableCell align="right">Chg%</TableCell>
            <TableCell align="right">OI</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {enhancedOptions.map((row) => {
            // Check if this strike is a support or resistance level
            const { isSupport, isResistance } = isSupportResistance(
              row.strikePrice
            );

            // Get trading opportunities
            const callOpportunity = row.call
              ? getOpportunityData(row.strikePrice, 'call')
              : null;
            const putOpportunity = row.put
              ? getOpportunityData(row.strikePrice, 'put')
              : null;

            return (
              <OptionRow
                key={row.strikePrice}
                row={row}
                underlying={underlying}
                isSelected={row.strikePrice === selectedRow}
                selectedOptionType={selectedOptionType}
                isSupport={isSupport}
                isResistance={isResistance}
                callOpportunity={callOpportunity}
                putOpportunity={putOpportunity}
                handleOptionSelect={handleOptionSelect}
                formatNumber={formatNumber}
                formatChange={formatChange}
                formatPriceDifference={formatPriceDifference}
                selectedExpiry={selectedExpiry}
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
    </>
  );
};

export default OptionsTable;
