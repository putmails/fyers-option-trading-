import { fyersModel } from "fyers-web-sdk-v3";
import { getStoredAccessToken } from './fyers-auth-service';

/**
 * Get option chain data from Fyers API
 * @param {string} symbol - Symbol to fetch option chain (e.g., "NSE:TCS-EQ")
 * @param {number} strikeCount - Number of strikes to include
 * @param {string} timestamp - Optional timestamp
 * @returns {Promise<object>} Option chain data
 */
export const getOptionChainData = async (symbol, strikeCount = 5, timestamp = "") => {
  try {
    // Create a new instance of FyersAPI
    const fyers = new fyersModel();
    
    // Set app ID from environment variable
    fyers.setAppId(import.meta.env.VITE_FYERS_APP_ID);
    
    // Set redirect URL from environment variable
    fyers.setRedirectUrl(import.meta.env.VITE_FYERS_REDIRECT_URI);
    
    // Get access token from cookies
    const accessToken = getStoredAccessToken();
    
    if (!accessToken) {
      throw new Error("Access token not found. Please login again.");
    }
    
    // Set access token
    fyers.setAccessToken(accessToken);
    
    // Define input parameters for option chain
    const params = {
      "symbol": symbol,
      "strikecount": strikeCount,
      "timestamp": timestamp
    };
    
    // Fetch option chain data
    const response = await fyers.getOptionChain(params);
    
    // Check for successful response
    if (response.s === 'ok' && response.code === 200 && response.data) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to fetch option chain data');
    }
  } catch (error) {
    console.error("Error fetching option chain:", error);
    throw error;
  }
};

/**
 * Get available symbols for options trading
 * @returns {Promise<array>} List of available symbols
 */
export const getAvailableSymbols = async () => {
  // This is a simplified version - in a real app, you would fetch this from an API
  // Here we're returning hardcoded values for demo purposes
  return [
    { label: 'NIFTY', value: 'NSE:NIFTY50-INDEX' },
    { label: 'BANKNIFTY', value: 'NSE:BANKNIFTY-INDEX' },
    { label: 'TCS', value: 'NSE:TCS-EQ' },
    { label: 'RELIANCE', value: 'NSE:RELIANCE-EQ' },
    { label: 'INFY', value: 'NSE:INFY-EQ' },
    { label: 'SBIN', value: 'NSE:SBIN-EQ' }
  ];
};

/**
 * Format option chain data for UI consumption
 * @param {object} data - Raw option chain data from API
 * @returns {object} Formatted option chain data
 */
export const formatOptionChainData = (data) => {
  if (!data || !data.optionsChain) {
    return {
      underlying: null,
      expiryDates: [],
      options: []
    };
  }

  // Extract underlying asset data (usually the first item in optionsChain with strike_price -1)
  const underlying = data.optionsChain.find(item => item.strike_price === -1) || null;
  
  // Extract expiry dates
  const expiryDates = data.expiryData?.map(exp => ({
    label: exp.date,
    value: exp.expiry
  })) || [];
  
  // Group options by strike price
  const optionsByStrike = {};
  
  data.optionsChain.forEach(item => {
    // Skip the underlying asset
    if (item.strike_price === -1) return;
    
    const strikePrice = item.strike_price;
    
    if (!optionsByStrike[strikePrice]) {
      optionsByStrike[strikePrice] = {
        strikePrice,
        call: null,
        put: null
      };
    }
    
    if (item.option_type === 'CE') {
      optionsByStrike[strikePrice].call = item;
    } else if (item.option_type === 'PE') {
      optionsByStrike[strikePrice].put = item;
    }
  });
  
  // Convert to array and sort by strike price
  const options = Object.values(optionsByStrike).sort((a, b) => a.strikePrice - b.strikePrice);
  
  return {
    underlying,
    expiryDates,
    options
  };
};