import { calculateGreeks, calculateOptionPrice } from './options-helper';

/**
 * Calculates support and resistance levels for an underlying asset
 * @param {number} spotPrice - Current price of the underlying asset
 * @param {Array} optionsData - Array of options data
 * @param {number} volatility - Historical volatility of the underlying
 * @returns {Object} Support and resistance levels
 */
export const calculateSupportResistance = (spotPrice, optionsData, volatility = 0.2) => {
  if (!spotPrice || !optionsData || !optionsData.length) {
    return { support: [], resistance: [] };
  }

  // Extract strike prices
  // eslint-disable-next-line no-unused-vars
  const strikes = optionsData.map(option => option.strikePrice).sort((a, b) => a - b);
  
  // Get high open interest strikes
  const callOI = optionsData.map(option => ({
    strike: option.strikePrice,
    oi: option.call?.oi || 0,
    type: 'call'
  })).filter(item => item.oi > 0);
  
  const putOI = optionsData.map(option => ({
    strike: option.strikePrice,
    oi: option.put?.oi || 0,
    type: 'put'
  })).filter(item => item.oi > 0);
  
  // Sort by OI (highest first)
  callOI.sort((a, b) => b.oi - a.oi);
  putOI.sort((a, b) => b.oi - a.oi);
  
  // Get top 3 strike prices with highest OI
  const topCallStrikes = callOI.slice(0, 3).map(item => item.strike);
  const topPutStrikes = putOI.slice(0, 3).map(item => item.strike);
  
  // Calculate price-based support/resistance
  const dailyVolatility = volatility / Math.sqrt(252); // Approximate daily volatility
  const priceMove = spotPrice * dailyVolatility;
  
  // Initial support/resistance based on volatility
  const volBasedSupport = [
    parseFloat((spotPrice - priceMove).toFixed(2)),
    parseFloat((spotPrice - 2 * priceMove).toFixed(2))
  ];
  
  const volBasedResistance = [
    parseFloat((spotPrice + priceMove).toFixed(2)),
    parseFloat((spotPrice + 2 * priceMove).toFixed(2))
  ];
  
  // Combine OI-based and volatility-based levels
  const support = [...topPutStrikes.filter(strike => strike < spotPrice), ...volBasedSupport]
    .sort((a, b) => b - a) // Sort descending (closest to spot first)
    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
  
  const resistance = [...topCallStrikes.filter(strike => strike > spotPrice), ...volBasedResistance]
    .sort((a, b) => a - b) // Sort ascending (closest to spot first)
    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
  
  return { support, resistance };
};

/**
 * Calculate implied volatility from market data
 * 
 * @param {Object} optionsData - Option chain data
 * @param {number} spotPrice - Current price of the underlying
 * @returns {number} Implied volatility estimate
 */
export const estimateImpliedVolatility = (optionsData, spotPrice) => {
  if (!optionsData || !optionsData.length || !spotPrice) {
    return 0.3; // Default value if calculation isn't possible
  }
  
  // Find ATM options (closest to spot price)
  optionsData.sort((a, b) => Math.abs(a.strikePrice - spotPrice) - Math.abs(b.strikePrice - spotPrice));
  
  const atmOption = optionsData[0];
  
  if (!atmOption || (!atmOption.call && !atmOption.put)) {
    return 0.3;
  }
  
  // Use call and put average IV for better estimate
  let totalIV = 0;
  let count = 0;
  
  if (atmOption.call) {
    // Simple volatility estimate based on ATM call option price
    const callIV = estimateIVFromPrice(
      'call',
      atmOption.call.ltp,
      spotPrice,
      atmOption.strikePrice,
      30/365 // Assuming 30 days to expiry
    );
    
    if (callIV > 0) {
      totalIV += callIV;
      count++;
    }
  }
  
  if (atmOption.put) {
    // Simple volatility estimate based on ATM put option price
    const putIV = estimateIVFromPrice(
      'put',
      atmOption.put.ltp,
      spotPrice,
      atmOption.strikePrice,
      30/365 // Assuming 30 days to expiry
    );
    
    if (putIV > 0) {
      totalIV += putIV;
      count++;
    }
  }
  
  return count > 0 ? totalIV / count : 0.3;
};

/**
 * Estimate IV from option price using bisection method
 */
const estimateIVFromPrice = (type, optionPrice, spotPrice, strikePrice, timeToExpiry, riskFreeRate = 0.05) => {
  if (!optionPrice || optionPrice <= 0) return 0;
  
  let low = 0.01;
  let high = 3.0;
  let mid, price, error;
  const tolerance = 0.001;
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    mid = (low + high) / 2;
    price = calculateOptionPrice(type, spotPrice, strikePrice, timeToExpiry, mid, riskFreeRate);
    error = Math.abs(price - optionPrice);
    
    if (error < tolerance) {
      return mid;
    }
    
    if (price > optionPrice) {
      high = mid;
    } else {
      low = mid;
    }
  }
  
  return mid; // Best estimate after max iterations
};

/**
 * Calculate theoretical option prices for the option chain
 * @param {Array} optionsData - Option chain data
 * @param {number} spotPrice - Underlying asset price
 * @param {string} expiryDate - Expiry date in DD-MM-YYYY format
 * @param {number} ivEstimate - Estimated implied volatility
 * @returns {Array} Option chain with theoretical prices
 */
export const calculateTheoreticalPrices = (optionsData, spotPrice, expiryDate, ivEstimate = 0.3) => {
  if (!optionsData || !optionsData.length || !spotPrice) {
    return [];
  }
  
  // Calculate days to expiry
  let daysToExpiry = 30; // Default to 30 days
  if (expiryDate) {
    const [day, month, year] = expiryDate.split('-').map(part => parseInt(part, 10));
    const expiryTime = new Date(year, month - 1, day).getTime();
    const currentTime = new Date().getTime();
    daysToExpiry = Math.max(1, Math.ceil((expiryTime - currentTime) / (1000 * 60 * 60 * 24)));
  }
  
  const timeToExpiry = daysToExpiry / 365; // Convert to years
  
  // Enhance each option with theoretical price
  return optionsData.map(option => {
    const enhancedOption = { ...option };
    
    if (option.call) {
      const theoreticalPrice = calculateOptionPrice(
        'call',
        spotPrice,
        option.strikePrice,
        timeToExpiry,
        ivEstimate
      );
      
      enhancedOption.call = {
        ...option.call,
        theoreticalPrice,
        priceDifference: option.call.ltp - theoreticalPrice,
        percentDifference: ((option.call.ltp - theoreticalPrice) / theoreticalPrice) * 100,
        greeks: calculateGreeks('call', spotPrice, option.strikePrice, timeToExpiry, ivEstimate)
      };
    }
    
    if (option.put) {
      const theoreticalPrice = calculateOptionPrice(
        'put',
        spotPrice,
        option.strikePrice,
        timeToExpiry,
        ivEstimate
      );
      
      enhancedOption.put = {
        ...option.put,
        theoreticalPrice,
        priceDifference: option.put.ltp - theoreticalPrice,
        percentDifference: ((option.put.ltp - theoreticalPrice) / theoreticalPrice) * 100,
        greeks: calculateGreeks('put', spotPrice, option.strikePrice, timeToExpiry, ivEstimate)
      };
    }
    
    return enhancedOption;
  });
};

/**
 * Identify trading opportunities based on price differences
 * @param {Array} optionsWithTheoreticalPrices - Option chain with theoretical prices
 * @returns {Object} Trading opportunities
 */
export const identifyTradingOpportunities = (optionsWithTheoreticalPrices) => {
  if (!optionsWithTheoreticalPrices || !optionsWithTheoreticalPrices.length) {
    return { callOpportunities: [], putOpportunities: [] };
  }
  
  const THRESHOLD_PERCENT = 10; // Threshold for significant price difference (%)
  
  const callOpportunities = [];
  const putOpportunities = [];
  
  optionsWithTheoreticalPrices.forEach(option => {
    if (option.call && Math.abs(option.call.percentDifference) >= THRESHOLD_PERCENT) {
      // If market price > theoretical price by threshold%, it's overpriced (sell opportunity)
      // If market price < theoretical price by threshold%, it's underpriced (buy opportunity)
      const opportunity = {
        strike: option.strikePrice,
        marketPrice: option.call.ltp,
        theoreticalPrice: option.call.theoreticalPrice,
        percentDifference: option.call.percentDifference,
        action: option.call.percentDifference > 0 ? 'SELL' : 'BUY',
        score: Math.abs(option.call.percentDifference) // Higher score means stronger signal
      };
      
      callOpportunities.push(opportunity);
    }
    
    if (option.put && Math.abs(option.put.percentDifference) >= THRESHOLD_PERCENT) {
      const opportunity = {
        strike: option.strikePrice,
        marketPrice: option.put.ltp,
        theoreticalPrice: option.put.theoreticalPrice,
        percentDifference: option.put.percentDifference,
        action: option.put.percentDifference > 0 ? 'SELL' : 'BUY',
        score: Math.abs(option.put.percentDifference)
      };
      
      putOpportunities.push(opportunity);
    }
  });
  
  // Sort by score (highest first)
  callOpportunities.sort((a, b) => b.score - a.score);
  putOpportunities.sort((a, b) => b.score - a.score);
  
  return { callOpportunities, putOpportunities };
};
