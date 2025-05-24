import React, { useMemo } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableRow, Paper } from '@mui/material';
import useOptionStore from '../../store/option-store';
import { calculateParityDeviation } from '../../utils/optionPricingUtils';

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

  const summary = useMemo(() => {
    if (!formattedData || !formattedData.options?.length) return null;
    const spot = formattedData.underlying?.ltp;
    let atmOption = formattedData.options.reduce((prev, curr) =>
      Math.abs(curr.strikePrice - spot) < Math.abs(prev.strikePrice - spot) ? curr : prev
    );
    // IV and HV (ATM, robust)
    let iv = null, hv = null, ivhv = null;
    // Prefer ATM option's IV, fallback to average of all ATM call/put IVs if missing
    if (atmOption.call?.impliedVolatility && atmOption.put?.impliedVolatility) {
      iv = (atmOption.call.impliedVolatility + atmOption.put.impliedVolatility) / 2;
    } else {
      // Try to average all ATM-like strikes (within 1% of spot)
      const atmBand = formattedData.options.filter(opt => Math.abs(opt.strikePrice - spot) < spot * 0.01);
      const ivs = [];
      atmBand.forEach(opt => {
        if (opt.call?.impliedVolatility) ivs.push(opt.call.impliedVolatility);
        if (opt.put?.impliedVolatility) ivs.push(opt.put.impliedVolatility);
      });
      if (ivs.length) {
        iv = ivs.reduce((a, b) => a + b, 0) / ivs.length;
      } else {
        iv = volatilityData?.impliedVolatility;
      }
    }
    hv = volatilityData?.historicalVolatility;
    ivhv = hv ? iv / hv : null;
    // PCR (total OI, robust)
    const callOi = formattedData.options.reduce((acc, o) => acc + (o.call?.oi ?? o.call?.openInterest ?? 0), 0);
    const putOi = formattedData.options.reduce((acc, o) => acc + (o.put?.oi ?? o.put?.openInterest ?? 0), 0);
    const pcr = callOi > 0 ? putOi / callOi : null;
    // Put-Call Arbitrage at ATM (use put-call parity, fallback to 0 if missing)
    let arbitrage = 0;
    if (
      atmOption.call?.ltp != null &&
      atmOption.put?.ltp != null &&
      atmOption.strikePrice != null &&
      spot != null &&
      formattedData.expiryDate
    ) {
      arbitrage = Number(
        calculateParityDeviation(
          atmOption.call.ltp,
          atmOption.put.ltp,
          spot,
          atmOption.strikePrice,
          formattedData.expiryDate
        )
      );
    }
    // Volume at ATM
    const volume = {
      CE: atmOption.call?.volume || 0,
      PE: atmOption.put?.volume || 0
    };
    // OI Change % at ATM
    const oiChange = {
      CE: atmOption.call?.oiChangePercent || 0,
      PE: atmOption.put?.oiChangePercent || 0
    };
    return {
      IV: iv,
      'IV/HV': ivhv,
      PCR: pcr,
      Arbitrage: arbitrage,
      Volume: volume,
      OIChange: oiChange
    };
  }, [formattedData, volatilityData]);

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
                    label === 'Volume' ? `${value?.CE} / ${value.PE}` : `${value?.CE?.toFixed(2) ?? 0} / ${value?.PE?.toFixed(2) ?? 0}`
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
