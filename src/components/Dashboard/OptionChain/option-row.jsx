import React from 'react';
import {
  TableRow,
  TableCell,
  Box,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { calculateParityDeviation } from '../../../utils/optionPricingUtils';
import { RISK_FREE_INTEREST } from '../../../utils/constant';
import { ChangeFormat } from './format-change';

/**
 * Component representing a single row in the option chain table
 */
const OptionRow = ({
  row,
  underlying,
  isSelected,
  selectedOptionType,
  isSupport,
  isResistance,
  callOpportunity,
  putOpportunity,
  handleOptionSelect,
  formatNumber,
  formatPriceDifference,
  selectedExpiry,
}) => {
  // Calculate ATM/ITM/OTM status
  const atmStrike = underlying?.ltp
    ? Math.abs(row.strikePrice - underlying.ltp) < underlying.ltp * 0.005
    : false;

  const callITM = underlying?.ltp && row.strikePrice < underlying.ltp;
  const putITM = underlying?.ltp && row.strikePrice > underlying.ltp;

  // Get volatility analysis
  const callVolatility = row.call?.volatilityAnalysis;
  const putVolatility = row.put?.volatilityAnalysis;

  const oiDiff = row.call?.oi - row.put?.oi;
  // Determine row background color based on support/resistance
  let rowBgColor = '';
  if (isSelected) {
    rowBgColor = 'rgba(25, 118, 210, 0.08)';
  } else if (atmStrike) {
    rowBgColor = 'rgba(255, 236, 179, 0.4)';
  } else if (isSupport) {
    rowBgColor = 'rgba(129, 199, 132, 0.15)';
  } else if (isResistance) {
    rowBgColor = 'rgba(229, 115, 115, 0.15)';
  } else if (row.strikePrice % 2 === 0) {
    rowBgColor = 'rgba(0, 0, 0, 0.02)';
  } else if (oiDiff > 150000) {
    rowBgColor = 'rgba(211, 104, 104, 0.1)';
  } else if (oiDiff <= -150000) {
    rowBgColor = 'rgba(47, 136, 209, 0.1)';
  }

  const parityDeviation = calculateParityDeviation(
    row.call?.ltp,
    row.put?.ltp,
    underlying?.ltp,
    row.strikePrice,
    selectedExpiry.value,
    RISK_FREE_INTEREST
  );
  return (
    <TableRow
      sx={{
        backgroundColor: rowBgColor,
        position: 'relative',
      }}
    >
      {/* Call Columns */}
      <TableCell
        align="right"
        sx={{
          backgroundColor: callITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
        }}
      >
        {row.call?.oi ? formatNumber(row.call.oi, 0) : '-'}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          backgroundColor: callITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
        }}
      >
        {row.call?.oichp ? <ChangeFormat change={row.call.oichp} /> : '-'}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          backgroundColor: callITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
        }}
      >
        {row.call?.volume ? formatNumber(row.call.volume, 0) : '-'}
      </TableCell>

      {/* Call IV/HV Ratio */}
      <TableCell
        align="right"
        sx={{
          backgroundColor: callITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
          color:
            callVolatility?.skewRatio > 1.1
              ? 'error.main'
              : callVolatility?.skewRatio < 0.9
              ? 'success.main'
              : 'text.secondary',
          fontWeight: 'medium',
        }}
      >
        {callVolatility ? callVolatility.skewRatio.toFixed(2) : '-'}
      </TableCell>

      <TableCell
        align="right"
        sx={{
          backgroundColor: callITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
          fontWeight: 'medium',
          cursor: row.call ? 'pointer' : 'default',
          ...(isSelected && selectedOptionType === 'call'
            ? {
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                fontWeight: 'bold',
              }
            : {}),
          ...(callOpportunity
            ? {
                backgroundColor:
                  callOpportunity.action === 'BUY'
                    ? 'rgba(76, 175, 80, 0.3)'
                    : 'rgba(244, 67, 54, 0.3)',
              }
            : {}),
        }}
        onClick={() => row.call && handleOptionSelect(row, 'call')}
      >
        {row.call?.ltp ? (
          <Tooltip
            title={
              callOpportunity || callVolatility?.tradingSignal
                ? `${
                    callOpportunity?.action || callVolatility?.tradingSignal
                  } opportunity - ${Math.abs(
                    row.call.priceDifference ||
                      callVolatility?.skewPercentage ||
                      0
                  ).toFixed(1)}% ${
                    row.call.priceDifference > 0 ||
                    callVolatility?.skewRatio > 1
                      ? 'overpriced'
                      : 'underpriced'
                  }`
                : ''
            }
            arrow
            placement="top"
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              {(callOpportunity?.action === 'BUY' ||
                callVolatility?.tradingSignal === 'BUY' ||
                callVolatility?.tradingSignal === 'NEUTRAL_BUY') && (
                <ArrowUpwardIcon
                  fontSize="small"
                  color="success"
                  sx={{ mr: 0.5 }}
                />
              )}
              {(callOpportunity?.action === 'SELL' ||
                callVolatility?.tradingSignal === 'SELL' ||
                callVolatility?.tradingSignal === 'NEUTRAL_SELL') && (
                <ArrowDownwardIcon
                  fontSize="small"
                  color="error"
                  sx={{ mr: 0.5 }}
                />
              )}
              {formatNumber(row.call.ltp, 2)}
            </Box>
          </Tooltip>
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          backgroundColor: callITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
          color: 'text.secondary',
        }}
      >
        {row.call?.theoreticalPrice
          ? formatNumber(row.call.theoreticalPrice, 2)
          : '-'}
      </TableCell>
      <TableCell
        align="center"
        sx={{
          backgroundColor: callITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
        }}
      >
        {row.call?.priceDifference
          ? formatPriceDifference(row.call.priceDifference)
          : '-'}
      </TableCell>

      {/* Strike Price */}
      <TableCell
        align="center"
        sx={{
          fontWeight: 'bold',
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          position: 'relative',
        }}
      >
        {formatNumber(row.strikePrice, 0)}
        {(isSupport || isResistance) && (
          <Chip
            label={isSupport ? 'S' : 'R'}
            size="small"
            color={isSupport ? 'success' : 'error'}
            sx={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              height: '16px',
              minWidth: '16px',
              fontSize: '0.6rem',
            }}
          />
        )}
      </TableCell>
      {/* ParityDeviation */}
      <TableCell
        align="center"
        sx={{
          backgroundColor: putITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
        }}
      >
        {parityDeviation}
      </TableCell>
      {/* Strike Price */}
      <TableCell
        align="center"
        sx={{
          fontWeight: 'bold',
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          position: 'relative',
        }}
      >
        {formatNumber(row.strikePrice, 0)}
        {(isSupport || isResistance) && (
          <Chip
            label={isSupport ? 'S' : 'R'}
            size="small"
            color={isSupport ? 'success' : 'error'}
            sx={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              height: '16px',
              minWidth: '16px',
              fontSize: '0.6rem',
            }}
          />
        )}
      </TableCell>

      {/* Put Columns */}
      <TableCell
        align="center"
        sx={{
          backgroundColor: putITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
        }}
      >
        {row.put?.priceDifference
          ? formatPriceDifference(row.put.priceDifference)
          : '-'}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          backgroundColor: putITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
          color: 'text.secondary',
        }}
      >
        {row.put?.theoreticalPrice
          ? formatNumber(row.put.theoreticalPrice, 2)
          : '-'}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          backgroundColor: putITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
          fontWeight: 'medium',
          cursor: row.put ? 'pointer' : 'default',
          ...(isSelected && selectedOptionType === 'put'
            ? {
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                fontWeight: 'bold',
              }
            : {}),
          ...(putOpportunity
            ? {
                backgroundColor:
                  putOpportunity.action === 'BUY'
                    ? 'rgba(76, 175, 80, 0.3)'
                    : 'rgba(244, 67, 54, 0.3)',
              }
            : {}),
        }}
        onClick={() => row.put && handleOptionSelect(row, 'put')}
      >
        {row.put?.ltp ? (
          <Tooltip
            title={
              putOpportunity || putVolatility?.tradingSignal
                ? `${
                    putOpportunity?.action || putVolatility?.tradingSignal
                  } opportunity - ${Math.abs(
                    row.put.priceDifference ||
                      putVolatility?.skewPercentage ||
                      0
                  ).toFixed(1)}% ${
                    row.put.priceDifference > 0 || putVolatility?.skewRatio > 1
                      ? 'overpriced'
                      : 'underpriced'
                  }`
                : ''
            }
            arrow
            placement="top"
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              {(putOpportunity?.action === 'BUY' ||
                putVolatility?.tradingSignal === 'BUY' ||
                putVolatility?.tradingSignal === 'NEUTRAL_BUY') && (
                <ArrowUpwardIcon
                  fontSize="small"
                  color="success"
                  sx={{ mr: 0.5 }}
                />
              )}
              {(putOpportunity?.action === 'SELL' ||
                putVolatility?.tradingSignal === 'SELL' ||
                putVolatility?.tradingSignal === 'NEUTRAL_SELL') && (
                <ArrowDownwardIcon
                  fontSize="small"
                  color="error"
                  sx={{ mr: 0.5 }}
                />
              )}
              {formatNumber(row.put.ltp, 2)}
            </Box>
          </Tooltip>
        ) : (
          '-'
        )}
      </TableCell>

      {/* Put IV/HV Ratio */}
      <TableCell
        align="right"
        sx={{
          backgroundColor: putITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
          color:
            putVolatility?.skewRatio > 1.1
              ? 'error.main'
              : putVolatility?.skewRatio < 0.9
              ? 'success.main'
              : 'text.secondary',
          fontWeight: 'medium',
        }}
      >
        {putVolatility ? putVolatility.skewRatio.toFixed(2) : '-'}
      </TableCell>

      <TableCell
        align="right"
        sx={{
          backgroundColor: putITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
        }}
      >
        {row.put?.volume ? formatNumber(row.put.volume, 0) : '-'}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          backgroundColor: putITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
        }}
      >
        {row.put?.oichp ? <ChangeFormat change={row.put.oichp} /> : '-'}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          backgroundColor: putITM ? 'rgba(200, 230, 201, 0.3)' : 'transparent',
        }}
      >
        {row.put?.oi ? formatNumber(row.put.oi, 0) : '-'}
      </TableCell>
    </TableRow>
  );
};

export default OptionRow;
