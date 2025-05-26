/**
 * Main service for hybrid option pricing
 * Integrates multiple pricing models for accurate option pricing
 */

import { RISK_FREE_INTEREST } from '../utils/constant';
import {
  calculateCallPrice,
  calculatePutPrice,
  calculateGreeks,
} from '../utils/optionPricingModels/blackScholes';
import {
  calculateImpliedVolatility,
  // calculateDaysToExpiry,
  // daysToYears,
  getTimeToExpiry,
} from '../utils/optionPricingUtils';

/**
 * Determine weights for different pricing models based on option characteristics
 * @param {object} optionCharacteristics - Option characteristics
 * @param {object} marketConditions - Current market conditions
 * @returns {object} - Model weights
 */
export function determineModelWeights(optionCharacteristics, marketConditions) {
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
    heston: hestonWeight,
  };
}

/**
 * Calculate option price using hybrid approach
 * @param {object} option - Option data
 * @param {object} underlyingData - Underlying asset data
 * @param {object} marketConditions - Current market conditions
 * @returns {object} - Pricing results
 */
function calculateHybridPrice({
  strikePrice,
  ltp,
  underlyingData,
  // marketConditions,
  expiryInMs,
  type,
  iv
  // useOnlyBS = true,
}) {
  const S = underlyingData.ltp;
  const K = strikePrice;
  // const daysToExpiry = calculateDaysToExpiry(expiryInMs);
  const T = getTimeToExpiry(expiryInMs);
  const r = RISK_FREE_INTEREST ?? 0.065;
  // const moneyness = calculateMoneyness(S, K);

  let impliedVolatility = 0.3;
  if (ltp) {
    impliedVolatility = calculateImpliedVolatility(ltp, S, K, T, r, type);
  }
  
  const bsPrice =
  type === 'call'
  ? calculateCallPrice(S, K, T, r, iv)
  : calculatePutPrice(S, K, T, r, iv);
  
  // if (useOnlyBS) {
    const greeks = calculateGreeks(S, K, T, r, impliedVolatility, type);
    return {
      type,
      ltp,
      underlyingPrice: S,
      timeToExpiryYears: T,
      impliedVolatility,
      hybridPrice: bsPrice,
      models: {
        blackScholes: { price: bsPrice, weight: 1 },
      },
      greeks,       
      pricingDate: new Date(),
    };
  
}

export function calculateOptionCallPutPrice(
  option,
  underlyingData,
  marketConditions,
  expiryInMs,
  iv
) {
  const result = {
    ...option,
    call: {
      ...option.call,
    },
    put: {
      ...option.put,
    },
    // strikePrice: option.strikePrice,
  };
  const callHybridPrice = calculateHybridPrice({
    strikePrice: option.strikePrice,
    ltp: option.call.ltp,
    underlyingData,
    marketConditions,
    expiryInMs,
    type: 'call',
    iv
  });
  const putHybridPrice = calculateHybridPrice({
    strikePrice: option.strikePrice,
    ltp: option.put.ltp,
    underlyingData,
    marketConditions,
    expiryInMs,
    type: 'put',
    iv
  });
  return {
    ...result,
    call: {
      ...result.call,
      ...callHybridPrice,
    },
    put: {
      ...result.put,
      ...putHybridPrice,
    },
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
    const pricingResult = calculateHybridPrice(
      option,
      underlyingData,
      marketConditions
    );
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
  if (!option.ltp) {
    return { absolute: 0, percentage: 0 };
  }

  const absolute = option.ltp - theoreticalPrice;
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
  getTradingSignal,
};
