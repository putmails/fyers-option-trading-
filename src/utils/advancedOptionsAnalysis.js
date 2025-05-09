/**
 * Advanced option pricing and analysis utilities
 * Integrates hybrid pricing model with existing app structure
 */

import { calculateCallPrice, calculatePutPrice, calculateGreeks } from './optionPricingModels/blackScholes';
import { calculateHestonPrice, calibrateHestonModel } from './optionPricingModels/heston';
import { getNeuralNetworkCorrection } from './optionPricingModels/neuralNetwork';
import { 
  calculateImpliedVolatility, 
  calculateMoneyness, 
  calculateDaysToExpiry, 
  daysToYears,
} from './optionPricingUtils';

/**
 * Calculate volatility for options chain
 * @param {Array} optionChain - Option chain data
 * @returns {object} - Put-call ratio and other volatility metrics
 */
export function calculateVolatilityMetrics(optionChain) {
  let totalCallVolume = 0;
  let totalPutVolume = 0;
  let totalCallOI = 0;
  let totalPutOI = 0;
  
  optionChain.forEach(option => {
      totalCallVolume += option.call.volume || 0;
      totalCallOI += option.call.oi || 0;
      totalPutVolume += option.put.volume || 0;
      totalPutOI += option.put.oi || 0;
  });
  
  const putCallVolumeRatio = totalPutVolume / totalCallVolume;
  const putCallOIRatio = totalPutOI / totalCallOI;
  
  return {
    putCallVolumeRatio,
    putCallOIRatio,
    totalCallVolume,
    totalPutVolume,
    totalCallOI,
    totalPutOI
  };
}

/**
 * Determine weights for different pricing models based on option characteristics
 * @param {object} optionCharacteristics - Option characteristics
 * @param {object} marketConditions - Current market conditions
 * @returns {object} - Model weights
 */
function determineModelWeights(optionCharacteristics, marketConditions) {
  // eslint-disable-next-line no-unused-vars
  const { moneyness, daysToExpiry, impliedVolatility } = optionCharacteristics;
  const { volatilityIndex } = marketConditions;
  
  // Initialize default weights
  let bsWeight = 0.5;
  let hestonWeight = 0.5;
  
  // Adjust weights based on moneyness
  if (moneyness < 0.95 || moneyness > 1.05) {
    // Deep ITM or OTM: favor Heston
    bsWeight -= 0.2;
    hestonWeight += 0.2;
  }
  
  // Adjust weights based on time to expiry
  if (daysToExpiry < 7) {
    // Very short term: favor Black-Scholes
    bsWeight += 0.3;
    hestonWeight -= 0.3;
  } else if (daysToExpiry > 30) {
    // Longer term: favor Heston
    bsWeight -= 0.2;
    hestonWeight += 0.2;
  }
  
  // Adjust weights based on market volatility
  if (volatilityIndex > 20) {
    // High volatility: favor Heston
    bsWeight -= 0.1;
    hestonWeight += 0.1;
  }
  
  // Normalize weights to ensure they sum to 1
  const totalWeight = bsWeight + hestonWeight;
  bsWeight = bsWeight / totalWeight;
  hestonWeight = hestonWeight / totalWeight;
  
  return {
    blackScholes: bsWeight,
    heston: hestonWeight
  };
}

/**
 * Calculate option price using hybrid approach
 * @param {object} option - Option data
 * @param {object} underlyingData - Underlying asset data
 * @param {object} marketConditions - Current market conditions
 * @returns {object} - Pricing results
 */
function calculateHybridPrice(option, underlyingData, marketConditions) {
  // Extract option parameters
  const S = underlyingData.price || underlyingData.lastPrice;
  const K = option.strikePrice || option.strike;
  const expiry = option.expiryDate || option.expiry;
  const daysToExpiry = calculateDaysToExpiry(new Date(expiry));
  const T = daysToYears(daysToExpiry);
  const type = option.optionType || option.type;
  const optionType = type === 'CE' || type === 'CALL' ? 'call' : 'put';
  
  // Use a reasonable risk-free rate for India
  const r = 0.06; // 6% annual rate (adjust as needed)
  
  // Calculate moneyness
  const moneyness = calculateMoneyness(S, K);
  
  // Calculate implied volatility from market price (if available)
  let impliedVolatility = 0.3; // Default assumption
  if (option.lastPrice) {
    impliedVolatility = calculateImpliedVolatility(
      option.lastPrice, S, K, T, r, optionType
    );
  }
  
  // Calculate Black-Scholes price
  const bsPrice = optionType === 'call' 
    ? calculateCallPrice(S, K, T, r, impliedVolatility)
    : calculatePutPrice(S, K, T, r, impliedVolatility);
  
  // Calculate Heston model price
  const hestonParams = calibrateHestonModel([]);
  const hestonPrice = calculateHestonPrice(
    S, K, T, r, 
    hestonParams.v0, 
    hestonParams.kappa, 
    hestonParams.theta, 
    hestonParams.sigma, 
    hestonParams.rho, 
    optionType
  );
  
  // Get neural network correction factor
  const nnCorrection = getNeuralNetworkCorrection(
    { moneyness, timeToExpiry: T },
    { impliedVolatility, ...marketConditions }
  );
  
  // Determine model weights based on option characteristics
  const weights = determineModelWeights(
    { moneyness, daysToExpiry, impliedVolatility },
    marketConditions
  );
  
  // Calculate final hybrid price
  const hybridPrice = (
    weights.blackScholes * bsPrice +
    weights.heston * hestonPrice
  ) * (1 + nnCorrection);
  
  // Calculate greeks for the hybrid model
  // For simplicity, we're using Black-Scholes greeks as a base
  const greeks = calculateGreeks(S, K, T, r, impliedVolatility, optionType);
  
  // Return comprehensive pricing results
  return {
    ...option, // Keep all original option data
    underlyingPrice: S,
    daysToExpiry,
    timeToExpiryYears: T,
    impliedVolatility,
    models: {
      blackScholes: { price: bsPrice, weight: weights.blackScholes },
      heston: { price: hestonPrice, weight: weights.heston },
      neuralCorrection: nnCorrection
    },
    hybridPrice,
    greeks,
    pricingDate: new Date()
  };
}

/**
 * Get price difference between market and theoretical prices
 * @param {object} option - Option with market price
 * @param {number} theoreticalPrice - Calculated theoretical price
 * @returns {object} - Price difference data
 */
function getPriceDifference(marketPrice, theoreticalPrice) {
  if (!marketPrice) {
    return { absolute: 0, percentage: 0 };
  }
  
  const absolute = marketPrice - theoreticalPrice;
  const percentage = (absolute / theoreticalPrice) * 100;
  
  return { absolute, percentage };
}

/**
 * Get trading signal based on price difference
 * @param {object} priceDifference - Price difference data
 * @returns {object} - Trading signal data
 */
function getTradingSignal(priceDifference) {
  const { percentage } = priceDifference;
  
  if (percentage > 10) {
    return { signal: 'SELL', strength: 'Strong', confidence: 0.8 };
  } else if (percentage > 5) {
    return { signal: 'SELL', strength: 'Moderate', confidence: 0.6 };
  } else if (percentage < -10) {
    return { signal: 'BUY', strength: 'Strong', confidence: 0.8 };
  } else if (percentage < -5) {
    return { signal: 'BUY', strength: 'Moderate', confidence: 0.6 };
  }
  
  return { signal: 'HOLD', strength: 'Neutral', confidence: 0.5 };
}

/**
 * Process option chain with advanced pricing and analysis
 * @param {Array} optionChainData - Raw option chain data 
 * @param {object} underlyingData - Underlying asset data
 * @param {object} marketConditions - Market conditions
 * @returns {Array} - Enhanced option chain with pricing and signals
 */
export function processOptionChain(optionChainData, underlyingData, marketConditions) {
  // Update market conditions with calculated volatility metrics
  const volatilityMetrics = calculateVolatilityMetrics(optionChainData);
  const enhancedMarketConditions = {
    ...marketConditions,
    putCallRatio: volatilityMetrics.putCallVolumeRatio
  };
  
  // Process each option with the hybrid pricing model
  const pricedOptions = optionChainData.map(option => {
    // Calculate hybrid price
    const pricedOption = calculateHybridPrice(option, underlyingData, enhancedMarketConditions);
    
    // Calculate price difference between market and theoretical
    const priceDifference = getPriceDifference(option.lastPrice, pricedOption.hybridPrice);
    
    // Generate trading signal based on price difference
    const tradingSignal = getTradingSignal(priceDifference);
    
    // Return enhanced option data
    return {
      ...pricedOption,
      priceDifference,
      tradingSignal
    };
  });
  
  return pricedOptions;
}