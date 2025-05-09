import React from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
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
}) => {
  if (!enhancedOptions || enhancedOptions.length === 0) return null;

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
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
            <TableCell align="center" rowSpan={2} sx={{ bgcolor: 'grey.300' }}>
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
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default OptionsTable;
