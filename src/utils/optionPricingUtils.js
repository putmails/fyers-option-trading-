/**
 * Helper functions for option pricing and analysis
 */

/**
 * Calculate implied volatility from market price
 * Using a simplified approach for demonstration
 */
// eslint-disable-next-line no-unused-vars
export function calculateImpliedVolatility(marketPrice, S, K, T, r, type) {
  // Simplified implementation
  // In a real implementation, you would use an iterative approach
  
  // For demonstration, return a reasonable value based on moneyness
  const moneyness = S / K;
  let baseVol = 0.25; // Base volatility
  
  // Adjust for strike (volatility smile)
  if (moneyness < 0.95) {
    baseVol += 0.05; // Higher vol for OTM puts / ITM calls
  } else if (moneyness > 1.05) {
    baseVol += 0.03; // Higher vol for OTM calls / ITM puts
  }
  
  // Adjust for time
  if (T < 0.1) { // Less than ~36 days
    baseVol += 0.02; // Higher vol for short-term options
  }
  
  return baseVol;
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
  const expiry = new Date(expiryDate);
  const timeDiff = expiry.getTime() - currentDate.getTime();
  return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
}

/**
 * Convert days to expiration to years
 */
export function daysToYears(days) {
  return days / 365;
}

/**
 * Get option type from option data
 */
export function getOptionType(option) {
  const type = option.optionType || option.type;
  return type === 'CE' || type.toUpperCase() === 'CALL' ? 'call' : 'put';
}