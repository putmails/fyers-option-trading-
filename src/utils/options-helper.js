/**
 * Helper functions for options trading calculations
 */

import { RISK_FREE_INTEREST } from "./constant";

/**
 * Calculate option Greeks using Black-Scholes model (simplified)
 * This is a basic implementation and real-world calculations would be more complex
 *
 * @param {string} type - "call" or "put"
 * @param {number} spotPrice - Current price of the underlying
 * @param {number} strikePrice - Strike price of the option
 * @param {number} timeToExpiry - Time to expiry in years
 * @param {number} volatility - Implied volatility (decimal)
 * @param {number} riskFreeRate - Risk-free interest rate (decimal)
 * @returns {object} Option Greeks
 */
export const calculateGreeks = (
  type,
  spotPrice,
  strikePrice,
  timeToExpiry,
  volatility,
  riskFreeRate  = RISK_FREE_INTEREST
) => {
  const S = spotPrice;
  const K = strikePrice;
  const T = timeToExpiry;
  const v = volatility;
  const r = riskFreeRate;

  // Helper functions for normal distribution
  const cdf = (x) => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1 / (1 + p * x);
    const y =
      1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1 + sign * y);
  };

  const pdf = (x) => {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  };

  // Calculate d1 and d2
  const d1 = (Math.log(S / K) + (r + 0.5 * v * v) * T) / (v * Math.sqrt(T));
  const d2 = d1 - v * Math.sqrt(T);

  let delta, gamma, theta, vega, rho;

  // Calculate Greeks based on option type
  if (type === 'call') {
    delta = cdf(d1);
    gamma = pdf(d1) / (S * v * Math.sqrt(T));
    theta =
      -(S * v * pdf(d1)) / (2 * Math.sqrt(T)) -
      r * K * Math.exp(-r * T) * cdf(d2);
    vega = (S * Math.sqrt(T) * pdf(d1)) / 100; // Divided by 100 for percentage point
    rho = (K * T * Math.exp(-r * T) * cdf(d2)) / 100; // Divided by 100 for percentage point
  } else {
    // put
    delta = cdf(d1) - 1;
    gamma = pdf(d1) / (S * v * Math.sqrt(T));
    theta =
      -(S * v * pdf(d1)) / (2 * Math.sqrt(T)) +
      r * K * Math.exp(-r * T) * cdf(-d2);
    vega = (S * Math.sqrt(T) * pdf(d1)) / 100; // Divided by 100 for percentage point
    rho = (-K * T * Math.exp(-r * T) * cdf(-d2)) / 100; // Divided by 100 for percentage point
  }

  return {
    delta: parseFloat(delta.toFixed(3)),
    gamma: parseFloat(gamma.toFixed(4)),
    theta: parseFloat(theta.toFixed(2)),
    vega: parseFloat(vega.toFixed(2)),
    rho: parseFloat(rho.toFixed(2)),
  };
};

/**
 * Calculate days to expiry from expiry date
 * @param {string} expiryDate - Expiry date in DD-MM-YYYY format
 * @returns {number} Days to expiry
 */
export const calculateDaysToExpiry = (expiryDate) => {
  if (!expiryDate) return 0;

  // Parse expiry date (DD-MM-YYYY)
  const [day, month, year] = expiryDate
    .split('-')
    .map((part) => parseInt(part, 10));
  const expiry = new Date(year, month - 1, day); // Month is 0-indexed in JavaScript

  // Current date at midnight
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Calculate difference in days
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
};

/**
 * Calculate implied volatility from option price (simple approximation)
 * @param {string} type - "call" or "put"
 * @param {number} optionPrice - Current price of the option
 * @param {number} spotPrice - Current price of the underlying
 * @param {number} strikePrice - Strike price of the option
 * @param {number} timeToExpiry - Time to expiry in years
 * @param {number} riskFreeRate - Risk-free interest rate (decimal)
 * @returns {number} Implied volatility (decimal)
 */
export const calculateImpliedVolatility = (
  type,
  optionPrice,
  spotPrice,
  strikePrice,
  timeToExpiry
  // riskFreeRate  = RISK_FREE_INTEREST
) => {
  // This is a very simplified approximation
  // Real IV calculation requires iterative solver

  // Starting with a rough estimate based on price ratio
  let vol =
    Math.abs(Math.log(spotPrice / strikePrice)) / Math.sqrt(timeToExpiry);

  // Add a component based on time value
  const intrinsicValue =
    type === 'call'
      ? Math.max(0, spotPrice - strikePrice)
      : Math.max(0, strikePrice - spotPrice);

  const timeValue = optionPrice - intrinsicValue;
  vol += (timeValue / (spotPrice * Math.sqrt(timeToExpiry))) * 0.5;

  // Ensure volatility is within reasonable bounds
  vol = Math.max(0.05, Math.min(2.0, vol));

  return parseFloat(vol.toFixed(2));
};

/**
 * Calculate Put-Call Ratio from option chain data
 * @param {object} optionChainData - Option chain data from Fyers API
 * @returns {number} Put-Call Ratio
 */
export const calculatePutCallRatio = (optionChainData) => {
  if (!optionChainData || !optionChainData.putOi || !optionChainData.callOi) {
    return 0;
  }

  return parseFloat(
    (optionChainData.putOi / optionChainData.callOi).toFixed(2)
  );
};

/**
 * Calculate Max Pain (the strike price at which option writers have the least financial pain)
 * @param {array} options - Formatted option chain data array
 * @returns {number} Max pain strike price
 */
export const calculateMaxPain = (options) => {
  if (!options || options.length === 0) {
    return 0;
  }

  // Calculate pain at each strike price
  const painByStrike = {};

  options.forEach((option) => {
    const strikePrice = option.strikePrice;

    // Skip if missing call or put data
    if (!option.call?.oi || !option.put?.oi) return;

    // Calculate pain for this strike for all option writers
    options.forEach((checkOption) => {
      const checkStrike = checkOption.strikePrice;

      if (!painByStrike[checkStrike]) {
        painByStrike[checkStrike] = 0;
      }

      // Pain to call writers if price ends at this strike
      if (option.call?.oi) {
        const callPain =
          Math.max(0, strikePrice - checkStrike) * option.call.oi;
        painByStrike[checkStrike] += callPain;
      }

      // Pain to put writers if price ends at this strike
      if (option.put?.oi) {
        const putPain = Math.max(0, checkStrike - strikePrice) * option.put.oi;
        painByStrike[checkStrike] += putPain;
      }
    });
  });

  // Find strike with minimum pain
  let minPain = Infinity;
  let maxPainStrike = 0;

  Object.entries(painByStrike).forEach(([strike, pain]) => {
    if (pain < minPain) {
      minPain = pain;
      maxPainStrike = parseInt(strike, 10);
    }
  });

  return maxPainStrike;
};

/**
 * Calculate option price using Black-Scholes model
 * @param {string} type - "call" or "put"
 * @param {number} spotPrice - Current price of the underlying
 * @param {number} strikePrice - Strike price of the option
 * @param {number} timeToExpiry - Time to expiry in years
 * @param {number} volatility - Implied volatility (decimal)
 * @param {number} riskFreeRate - Risk-free interest rate (decimal)
 * @returns {number} Theoretical option price
 */
export const calculateOptionPrice = (
  type,
  spotPrice,
  strikePrice,
  timeToExpiry,
  volatility,
  riskFreeRate = RISK_FREE_INTEREST
) => {
  // Input validation and edge cases
  if (!spotPrice || spotPrice <= 0) return 0;
  if (!strikePrice || strikePrice <= 0) return 0;
  if (volatility <= 0) return 0;
  
  const S = spotPrice;
  const K = strikePrice;
  const r = riskFreeRate;
  
  // Handle edge case: time to expiry very close to or at zero
  const epsilon = 1e-8; // Small constant to avoid division by zero
  const T = Math.max(timeToExpiry, epsilon);
  const v = volatility;

  // Very deep ITM or OTM options edge cases
  if (type === 'call' && S > K * 10) return Math.max(0, S - K * Math.exp(-r * T));
  if (type === 'call' && S < K / 10) return Math.max(0, S * 1e-10);
  if (type === 'put' && S < K / 10) return Math.max(0, K * Math.exp(-r * T) - S);
  if (type === 'put' && S > K * 10) return Math.max(0, S * 1e-10);

  // Handle extremely high volatility
  const maxVol = 5;
  const safeVol = Math.min(v, maxVol);
  
  // Helper function for normal distribution CDF
  const cdf = (x) => {
    // For extreme values, return 0 or 1 directly
    if (x < -8) return 0;
    if (x > 8) return 1;
    
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1 / (1 + p * x);
    const y =
      1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1 + sign * y);
  };

  try {
    // Calculate d1 and d2
    const d1 = (Math.log(S / K) + (r + 0.5 * safeVol * safeVol) * T) / (safeVol * Math.sqrt(T));
    const d2 = d1 - safeVol * Math.sqrt(T);

    // Calculate option price based on type
    let price;
    if (type === 'call') {
      price = S * cdf(d1) - K * Math.exp(-r * T) * cdf(d2);
    } else {
      // put
      price = K * Math.exp(-r * T) * cdf(-d2) - S * cdf(-d1);
    }

    // Ensure price is non-negative and handle NaN
    price = isNaN(price) ? 0 : Math.max(0, price);
    
    return price;
  } catch (error) {
    console.error("Error calculating option price:", error);
    // Fallback to intrinsic value
    if (type === 'call') {
      return Math.max(0, S - K);
    } else {
      return Math.max(0, K - S);
    }
  }
};

/**
 * Convert array of option chain data to object grouped by strike
 * @param {array} optionsChain - Array of option chain data from API
 * @returns {object} Object of options grouped by strike
 */
export const groupOptionsByStrike = (optionsChain) => {
  if (!optionsChain || !Array.isArray(optionsChain)) {
    return {};
  }

  const grouped = {};

  optionsChain.forEach((item) => {
    // Skip the underlying asset
    if (item.strike_price === -1 || !item.strike_price) return;

    const strikePrice = item.strike_price;

    if (!grouped[strikePrice]) {
      grouped[strikePrice] = {
        strikePrice,
        call: null,
        put: null,
      };
    }

    if (item.option_type === 'CE') {
      grouped[strikePrice].call = item;
    } else if (item.option_type === 'PE') {
      grouped[strikePrice].put = item;
    }
  });

  return grouped;
};
