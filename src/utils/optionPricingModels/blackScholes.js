/**
 * Black-Scholes model implementation for option pricing
 * Implements the classic Black-Scholes-Merton model for European options
 */

/**
 * Calculate the cumulative distribution function for standard normal distribution
 * @param {number} x - The value to calculate CDF for
 * @returns {number} - The CDF value
 */
function normalCDF(x) {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  // Save the sign of x
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2.0);
  
  // A&S formula 7.1.26
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1.0 + sign * y);
}

/**
 * Calculate the price of a European call option using Black-Scholes model
 * @param {number} S - Current price of the underlying asset
 * @param {number} K - Strike price
 * @param {number} T - Time to expiration in years
 * @param {number} r - Risk-free interest rate (e.g., 0.05 for 5%)
 * @param {number} sigma - Volatility of the underlying asset
 * @returns {number} - Call option price
 */
function calculateCallPrice(S, K, T, r, sigma) {
  // Check for invalid inputs
  if (S <= 0 || K <= 0 || T <= 0 || sigma <= 0) {
    console.error('Invalid input parameters for Black-Scholes model');
    return null;
  }

  // Calculate d1 and d2
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  // Calculate call price
  return S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
}

/**
 * Calculate the price of a European put option using Black-Scholes model
 * @param {number} S - Current price of the underlying asset
 * @param {number} K - Strike price
 * @param {number} T - Time to expiration in years
 * @param {number} r - Risk-free interest rate (e.g., 0.05 for 5%)
 * @param {number} sigma - Volatility of the underlying asset
 * @returns {number} - Put option price
 */
function calculatePutPrice(S, K, T, r, sigma) {
  // Check for invalid inputs
  if (S <= 0 || K <= 0 || T <= 0 || sigma <= 0) {
    console.error('Invalid input parameters for Black-Scholes model');
    return null;
  }

  // Calculate d1 and d2
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  // Calculate put price
  return K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
}

/**
 * Calculate option greeks using Black-Scholes model
 * @param {number} S - Current price of the underlying asset
 * @param {number} K - Strike price
 * @param {number} T - Time to expiration in years
 * @param {number} r - Risk-free interest rate (e.g., 0.05 for 5%)
 * @param {number} sigma - Volatility of the underlying asset
 * @param {string} type - Option type ('call' or 'put')
 * @returns {object} - Object containing the option greeks
 */
function calculateGreeks(S, K, T, r, sigma, type) {
  // Check for invalid inputs
  if (S <= 0 || K <= 0 || T <= 0 || sigma <= 0) {
    console.error('Invalid input parameters for calculating Greeks');
    return null;
  }

  // Calculate d1 and d2
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  
  // Standard normal PDF
  const pdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  
  // Calculate delta
  let delta;
  if (type === 'call') {
    delta = normalCDF(d1);
  } else {
    delta = normalCDF(d1) - 1;
  }
  
  // Calculate gamma (same for calls and puts)
  const gamma = pdf(d1) / (S * sigma * Math.sqrt(T));
  
  // Calculate theta
  let theta;
  if (type === 'call') {
    theta = -S * pdf(d1) * sigma / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normalCDF(d2);
  } else {
    theta = -S * pdf(d1) * sigma / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * normalCDF(-d2);
  }
  // Convert from yearly to daily theta
  theta = theta / 365;
  
  // Calculate vega (same for calls and puts)
  const vega = S * Math.sqrt(T) * pdf(d1) / 100; // Divide by 100 for 1% change
  
  // Calculate rho
  let rho;
  if (type === 'call') {
    rho = K * T * Math.exp(-r * T) * normalCDF(d2) / 100; // Divide by 100 for 1% change
  } else {
    rho = -K * T * Math.exp(-r * T) * normalCDF(-d2) / 100;
  }
  
  return { delta, gamma, theta, vega, rho };
}

export {
  calculateCallPrice,
  calculatePutPrice,
  calculateGreeks,
  normalCDF
};