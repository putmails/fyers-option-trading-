/**
 * Helper functions for option pricing and analysis
 */

import { DAYS_IN_A_YEAR } from "./constant";
import { calculateCallPrice, calculatePutPrice } from "./optionPricingModels/blackScholes";

/**
 * Calculate implied volatility from market price
 * Using a simplified approach for demonstration
 */
// eslint-disable-next-line no-unused-vars
export function calculateImpliedVolatility(marketPrice, S, K, T, r, type) {
  const MAX_ITERATIONS = 100;
  const PRECISION = 1e-5;
  let low = 0.0001;
  let high = 5;
  let mid = 0;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    mid = (low + high) / 2;
    const price = type === 'call'
      ? calculateCallPrice(S, K, T, r, mid)
      : calculatePutPrice(S, K, T, r, mid);
    
    const diff = price - marketPrice;

    if (Math.abs(diff) < PRECISION) {
      return mid;
    }

    if (diff > 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return mid; // Return best estimate after max iterations
}

/**
 * Calculate option moneyness (S/K ratio)
 */
export function calculateMoneyness(S, K) {
  return S / K;
}

/**
 * Calculate days to expiration
 */
export function calculateDaysToExpiry(expiryDate) {
  const currentDate = new Date();
  
  // Initialize expiry date
  let expiry;
  
  // Check if expiryDate is a number or string
  if (typeof expiryDate === 'number' || (typeof expiryDate === 'string' && /^\d+$/.test(expiryDate))) {
    // Convert to number if it's a numeric string
    const timestamp = typeof expiryDate === 'string' ? parseInt(expiryDate) : expiryDate;
    
    // Check if it's likely a Unix timestamp (seconds) or JavaScript timestamp (milliseconds)
    if (timestamp < 10000000000) {
      // It's a Unix timestamp (seconds)
      expiry = new Date(timestamp * 1000);
    } else {
      // It's already in milliseconds
      expiry = new Date(timestamp);
    }
  } else {
    // Handle as regular date string
    expiry = new Date(expiryDate);
  }
  
  // Calculate time difference
  const timeDiff = expiry.getTime() - currentDate.getTime();
  
  // Convert to days
  const rawDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  // If it's expiry day (0 days), return a small positive value
  // This ensures consistency with our daysToYears modification
  if (rawDays === 0 && timeDiff > 0) {
    // Return a value that represents part of a day if there are still some hours left
    // Calculate the fraction of a day remaining
    const hoursRemaining = timeDiff / (1000 * 3600);
    return Math.max(hoursRemaining / 24, 0.01); // At least 0.01 days (about 14 minutes)
  }
  
  // If it's already expired, return 0
  if (timeDiff <= 0) {
    return 0;
  }
  
  return rawDays;
}

/**
 * Convert days to expiration to years
 */
export function daysToYears(days) {
  return Math.max(days / DAYS_IN_A_YEAR, 0.00001);
}

/**
 * Get option type from option data
 */
export function getOptionType(option) {
  const type = option.optionType || option.type;
  return type === 'CE' || type.toUpperCase() === 'CALL' ? 'call' : 'put';
}

export function calculateParityDeviation(callLTP, putLTP, spot, strike, expiryInMS, r = 0.065) {

  const T = getTimeToExpiry(expiryInMS)

  const theoreticalDiff = spot - strike * Math.exp(-r * T);
  const actualDiff = callLTP - putLTP;

  const deviation = actualDiff - theoreticalDiff;
  const deviationPercentage = Math.abs(theoreticalDiff) >= 10 ? (deviation / theoreticalDiff) * 100 : 0;

  return {parityDeviation: deviation.toFixed(2), deviationPercentage: deviationPercentage.toFixed(2)};
}

export const getTimeToExpiry = (expiryInSeconds) => {
  const nowInSeconds = Date.now() / 1000;
  const secondsInAYear = DAYS_IN_A_YEAR * 24 * 60 * 60;
  const T = (expiryInSeconds - nowInSeconds) / secondsInAYear;
  return T;
};
