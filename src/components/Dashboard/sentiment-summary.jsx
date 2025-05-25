import React, { useMemo } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableRow, Paper } from '@mui/material';
import useOptionStore from '../../store/option-store';
import { calculateParityDeviation } from '../../utils/optionPricingUtils';
import { formatNumber } from '../../utils/common.utils';
import { RISK_FREE_INTEREST } from '../../utils/constant';

function getSentiment(value, type) {
  if (value == null || (typeof value === 'number' && isNaN(value))) return 'neutral';
  switch (type) {
    case 'IV':
      return value > 0.25 ? 'bearish' : value < 0.18 ? 'bullish' : 'neutral';
    case 'IV/HV':
      return value > 1.2 ? 'bearish' : value < 0.8 ? 'bullish' : 'neutral';
    case 'PCR':
      return value > 1 ? 'bearish' : value < 0.8 ? 'bullish' : 'neutral';
    case 'Arbitrage':
      return value > 0 ? 'bullish' : value < 0 ? 'bearish' : 'neutral';
    case 'Volume':
      return value.CE > value.PE ? 'bullish' : value.CE < value.PE ? 'bearish' : 'neutral';
    case 'OIChange':
      return value.CE > value.PE ? 'bullish' : value.CE < value.PE ? 'bearish' : 'neutral';
    default:
      return 'neutral';
  }
}

const SentimentSummary = () => {
  const { optionChainData: { formattedData }, volatilityData } = useOptionStore();
  const {atmPriceDetails, selectedExpiry} = useOptionStore();

  const summary = useMemo(() => {
    if (!formattedData || !formattedData.options?.length) return null;
    const spot = formattedData.underlying?.ltp;
    
    // IV and HV
    const iv = volatilityData?.impliedVolatility;
    const hv = volatilityData?.historicalVolatility;
    const ivhv = hv ? iv / hv : null;
    // PCR
    const callOi = formattedData.callOi;
    const putOi = formattedData.putOi;
    const pcr = callOi && putOi ? putOi / callOi : null;
    // Arbitrage at ATM
    const arbitrage = calculateParityDeviation(
      atmPriceDetails.call?.ltp,
      atmPriceDetails.put?.ltp,
      spot,
      atmPriceDetails.strikePrice,
      selectedExpiry.value,
      RISK_FREE_INTEREST
    );
    console.log("🚀 ~ summary ~ arbitrage:", arbitrage)
    // Volume at ATM
    const volume = {
      CE: atmPriceDetails.call?.volume || 0,
      PE: atmPriceDetails.put?.volume || 0
    };
    // OI Change % at ATM
    const oiChange = {
      CE: atmPriceDetails.call?.oiChangePercent || 0,
      PE: atmPriceDetails.put?.oiChangePercent || 0
    };
    return {
      IV: iv,
      'IV/HV': ivhv,
      PCR: pcr,
      Arbitrage: arbitrage,
      Volume: volume,
      OIChange: oiChange
    };
  }, [formattedData, volatilityData, atmPriceDetails, selectedExpiry]);

  if (!summary) return null;

  return (
    <Paper sx={{ mb: 2, p: 2 }}>
      <Typography variant="h6" gutterBottom>Market Sentiment Summary</Typography>
      <Table size="small">
        <TableBody>
          {Object.entries(summary).map(([label, value]) => {
            const sentiment = getSentiment(value, label);
            let bgColor = undefined;
            if (sentiment === 'bullish') bgColor = 'rgba(56, 142, 60, 0.15)'; // green
            if (sentiment === 'bearish') bgColor = 'rgba(211, 47, 47, 0.15)'; // red
            return (
              <TableRow key={label} style={bgColor ? { background: bgColor } : {}}>
                <TableCell>{label === 'OIChange' ? 'Total OI Change % (ATM)' : label === 'Volume' ? 'Volume (ATM CE/PE)' : label}</TableCell>
                <TableCell>
                  {typeof value === 'object' ?
                    label === 'Volume' ? `${formatNumber(value?.CE)} / ${formatNumber(value?.PE)}` : `${value?.CE?.toFixed(2) ?? 0} / ${value?.PE?.toFixed(2) ?? 0}`
                    : value != null ? Number(value).toFixed(2) : '-'}
                </TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{sentiment}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default SentimentSummary;
