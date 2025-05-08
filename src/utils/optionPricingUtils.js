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
  return Math.max(days / 365, 0.00001);
}

/**
 * Get option type from option data
 */
export function getOptionType(option) {
  const type = option.optionType || option.type;
  return type === 'CE' || type.toUpperCase() === 'CALL' ? 'call' : 'put';
}