/**
 * Main service for hybrid option pricing
 * Integrates multiple pricing models for accurate option pricing
 */

import { calculateCallPrice, calculatePutPrice, calculateGreeks } from '../utils/optionPricingModels/blackScholes';
import { calculateHestonPrice, calibrateHestonModel } from '../utils/optionPricingModels/heston';
import { getNeuralNetworkCorrection } from '../utils/optionPricingModels/neuralNetwork';
import { 
  calculateImpliedVolatility, 
  calculateMoneyness, 
  calculateDaysToExpiry, 
  daysToYears,
  getOptionType 
} from '../utils/optionPricingUtils';

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
  const S = underlyingData.price;
  const K = option.strike;
  const daysToExpiry = calculateDaysToExpiry(option.expiry);
  const T = daysToYears(daysToExpiry);
  const type = getOptionType(option.symbol);
  
  // Use a reasonable risk-free rate for India
  const r = 0.06; // 6% annual rate
  
  // Calculate moneyness
  const moneyness = calculateMoneyness(S, K);
  
  // Calculate implied volatility from market price (if available)
  let impliedVolatility = 0.3; // Default assumption
  if (option.lastPrice) {
    impliedVolatility = calculateImpliedVolatility(
      option.lastPrice, S, K, T, r, type
    );
  }
  
  // Calculate Black-Scholes price
  const bsPrice = type === 'call' 
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
    type
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
  const greeks = calculateGreeks(S, K, T, r, impliedVolatility, type);
  
  // Return comprehensive pricing results
  return {
    option,
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
 * Price an entire option chain using the hybrid approach
 * @param {Array} optionChain - Array of option data 
 * @param {object} underlyingData - Underlying asset data
 * @param {object} marketConditions - Current market conditions
 * @returns {Array} - Priced option chain
 */
function priceOptionChain(optionChain, underlyingData, marketConditions) {
  // Price each option in the chain
  const pricedOptions = [];
  
  for (const option of optionChain) {
    const pricingResult = calculateHybridPrice(option, underlyingData, marketConditions);
    pricedOptions.push(pricingResult);
  }
  
  return pricedOptions;
}

/**
 * Get price difference between market and theoretical prices
 * @param {object} option - Option with market price
 * @param {number} theoreticalPrice - Calculated theoretical price
 * @returns {object} - Price difference data
 */
function getPriceDifference(option, theoreticalPrice) {
  if (!option.lastPrice) {
    return { absolute: 0, percentage: 0 };
  }
  
  const absolute = option.lastPrice - theoreticalPrice;
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

export {
  calculateHybridPrice,
  priceOptionChain,
  getPriceDifference,
  getTradingSignal
};