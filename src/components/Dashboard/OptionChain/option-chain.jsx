import React, { useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

// Import sub-components
import {
  ControlPanel,
  SupportResistanceDisplay,
  VolatilityInfo,
  OpportunitiesSummary,
  UnderlyingInfo,
  OptionsTable,
  Legend,
  ChainSummary,
} from './';

import useOptionStore from '../../../store/option-store';
import { formatNumber } from '../../../utils/common.utils';

/**
 * Main component for option chain analysis
 */
const OptionChain = React.memo(() => {
  const {
    fetchOptionChain,
    selectedSymbol,
    error,
    isLoading,
    selectedExpiry,
    underlying,
    selectedRow,
    supportResistance,
    selectedOptionType,
    enhancedOptions,
    tradingOpportunities,
    setSelectedOptionType,
    setSelectedRowStrikePrice,
    setSelectedOptionDetail,
    atmPriceDetails
  } = useOptionStore();

  const intervalRef = useRef(null);
  // Fetch data when component mounts or symbol changes
  useEffect(() => {
    if (selectedSymbol || selectedExpiry.value) {

      fetchOptionChain(selectedSymbol, selectedExpiry);
      
      clearInterval(intervalRef.current);
      
      intervalRef.current = setInterval(() => {
        fetchOptionChain(selectedSymbol,selectedExpiry);
      }, 60000);
    }

    return () => clearInterval(intervalRef.current);
  }, [fetchOptionChain, selectedSymbol, selectedExpiry]);

  // Check if a strike price is a support or resistance level
  const isSupportResistance = useCallback(
    (strike) => {
      if (!supportResistance) return { isSupport: false, isResistance: false };

      const isSupport = supportResistance.support.includes(strike);
      const isResistance = supportResistance.resistance.includes(strike);

      return { isSupport, isResistance };
    },
    [supportResistance]
  );

  // Get trading opportunity data for a specific option
  const getOpportunityData = useCallback(
    (strike, type) => {
      const opportunities =
        type === 'call'
          ? tradingOpportunities.callOpportunities
          : tradingOpportunities.putOpportunities;

      return opportunities.find((opp) => opp.strike === strike) || null;
    },
    [tradingOpportunities]
  );

  // Handle option selection
  const handleOptionSelect = useCallback(
    (row, optionType) => {
      setSelectedRowStrikePrice?.(row.strikePrice);
      setSelectedOptionType(optionType);

      // Get the selected option data
      const optionDetail = optionType === 'call' ? row.call : row.put;
      setSelectedOptionDetail(optionDetail);
    },
    [setSelectedRowStrikePrice, setSelectedOptionType, setSelectedOptionDetail]
  );

  // Format price difference for display
  const formatPriceDifference = useCallback((difference) => {
    if (difference === null || difference === undefined) return null;

    const isOverpriced = difference > 0;
    const color = isOverpriced ? 'success.main' : 'error.main';
    const prefix = isOverpriced ? '+' : '';

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          component="span"
          color={color}
          fontWeight="medium"
          fontSize="0.8rem"
        >
          {prefix}
          {formatNumber(difference, 2)}
        </Typography>
      </Box>
    );
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">Options Chain</Typography>
        <IconButton onClick={() => {}} disabled={isLoading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Controls */}
      <Box sx={{display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',}}>
        <ControlPanel />

        <Box>
          {/* Support/Resistance Levels */}
          <SupportResistanceDisplay />

          {/* Volatility Information */}
          <VolatilityInfo />

          {/* Trading Opportunities Summary */}
          <OpportunitiesSummary tradingOpportunities={tradingOpportunities} />

          {/* Underlying asset info */}
          <UnderlyingInfo />
        </Box>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Option chain table */}
      {!isLoading && enhancedOptions.length > 0 ? (
        <OptionsTable
          enhancedOptions={enhancedOptions}
          underlying={underlying}
          selectedRow={selectedRow}
          selectedOptionType={selectedOptionType}
          isSupportResistance={isSupportResistance}
          getOpportunityData={getOpportunityData}
          handleOptionSelect={handleOptionSelect}
          formatNumber={formatNumber}
          formatPriceDifference={formatPriceDifference}
          selectedExpiry={selectedExpiry}
          atmPriceDetails={atmPriceDetails}
        />
      ) : !isLoading && !error ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography>
            No options data available. Please select a symbol and fetch data.
          </Typography>
        </Box>
      ) : null}

      {/* Legend */}
      <Legend />

      {/* Summary */}
      <ChainSummary />
    </Box>
  );
});

export default OptionChain;
