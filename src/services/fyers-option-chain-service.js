import { fyersModel } from 'fyers-web-sdk-v3';
import { getStoredAccessToken } from './fyers-auth-service';
import data from '../data/option-chain-data.json';
import {
  getTodayUnixTimestamp,
  getUnixTimestampNDaysAgo,
} from '../utils/common.utils';
import { PERIOD_DAYS } from '../utils/constant';
/**
 * Get option chain data from Fyers API
 * @param {string} symbol - Symbol to fetch option chain (e.g., "NSE:TCS-EQ")
 * @param {number} strikeCount - Number of strikes to include
 * @param {string} timestamp - Optional timestamp
 * @returns {Promise<object>} Option chain data
 */
export const getOptionChainData = async (
  symbol,
  strikeCount = 5,
  timestamp = '',
  isFile = false
) => {
  try {
    let response = null;
    if (isFile) {
      response = data;
      console.log('🚀 ~ Response from file:: response:', response);
    } else {
      // Create a new instance of FyersAPI
      const fyers = getFyersModelInstance();

      // Define input parameters for option chain
      const params = {
        symbol: symbol,
        strikecount: strikeCount,
        timestamp: timestamp,
      };

      // Fetch option chain data
      response = await fyers.getOptionChain(params);
      // const response = await new Promise((resolve) => {
      //   console.log("########################################## API is triggering")
      //     resolve({
      //       s: 'ok',
      //       code: 200,
      //       data: {
      //         optionsChain: [
      //           { strike_price: -1, option_type: 'CE', ...params },
      //           { strike_price: 1000, option_type: 'CE', ...params },
      //           { strike_price: 1100, option_type: 'PE', ...params },
      //           { strike_price: 1200, option_type: 'CE', ...params },
      //           { strike_price: 1300, option_type: 'PE', ...params },
      //         ],
      //         expiryData: [
      //           { date: '2023-10-26', expiry: '2023-10-26' },
      //           { date: '2023-11-02', expiry: '2023-11-02' },
      //         ],
      //       },
      //     });
      // }
      // );
      // console.log('🚀 ~ response from API Call::', response.s);
    }

    // Check for successful response
    if (response.s === 'ok' && response.code === 200 && response.data) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to fetch option chain data');
    }
  } catch (error) {
    console.error('Error fetching option chain:', error);
    throw error;
  }
};

const getFyersModelInstance = () => {
  // Create a new instance of FyersAPI
  const fyers = new fyersModel();

  // Set app ID from environment variable
  fyers.setAppId(import.meta.env.VITE_FYERS_APP_ID);

  // Set redirect URL from environment variable
  fyers.setRedirectUrl(import.meta.env.VITE_FYERS_REDIRECT_URI);

  // Get access token from cookies
  const accessToken = getStoredAccessToken();

  if (!accessToken) {
    throw new Error('Access token not found. Please login again.');
  }

  // Set access token
  fyers.setAccessToken(accessToken);

  return fyers;
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
    { label: 'BANKNIFTY', value: 'NSE:NIFTYBANK-INDEX' },
    // { label: 'TCS', value: 'NSE:TCS-EQ' },
    // { label: 'RELIANCE', value: 'NSE:RELIANCE-EQ' },
    // { label: 'INFY', value: 'NSE:INFY-EQ' },
    // { label: 'SBIN', value: 'NSE:SBIN-EQ' },
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
      options: [],
    };
  }

  // Extract underlying asset data (usually the first item in optionsChain with strike_price -1)
  const underlying =
    data.optionsChain.find((item) => item.strike_price === -1) || null;

  // Extract expiry dates
  const expiryDates =
    data.expiryData?.map((exp) => ({
      label: exp.date,
      value: exp.expiry,
    })) || [];

  // Group options by strike price
  const optionsByStrike = {};

  data.optionsChain.forEach((item) => {
    // Skip the underlying asset
    if (item.strike_price === -1) return;

    const strikePrice = item.strike_price;

    if (!optionsByStrike[strikePrice]) {
      optionsByStrike[strikePrice] = {
        strikePrice,
        call: null,
        put: null,
      };
    }

    if (item.option_type === 'CE') {
      optionsByStrike[strikePrice].call = item;
    } else if (item.option_type === 'PE') {
      optionsByStrike[strikePrice].put = item;
    }
  });

  // Convert to array and sort by strike price
  const options = Object.values(optionsByStrike).sort(
    (a, b) => a.strikePrice - b.strikePrice
  );

  return {
    underlying,
    expiryDates,
    options,
  };
};

export const fetchHistoricalCloses = async (symbol, days = PERIOD_DAYS) => {
  const from = getUnixTimestampNDaysAgo(days + 5); // extra buffer in case of holidays
  const to = getTodayUnixTimestamp();

  const body = {
    symbol,
    resolution: 'D', // Daily candles
    date_format: '0', // UNIX format
    range_from: from.toString(),
    range_to: to.toString(),
    cont_flag: '1',
  };


  const fyers = getFyersModelInstance()

  try {
    const response = await fyers.getHistory(body);
    console.log("🚀 ~ fetchHistoricalCloses ~ response:", response)
    const candles = await response.candles;

    if (!candles || days < candles.length) {
      console.warn('Insufficient data returned from Fyers API.');
      return null;
    }

    // Extract only the most recent N close prices
    const closes = candles.slice(-days).map((candle) => candle[4]); // 4 = close
    console.log("🚀 ~ fetchHistoricalCloses ~ closes:", closes)
    return closes;
  } catch (error) {
    console.error(
      'Error fetching historical data:',
      error.response?.data || error.message
    );
    return null;
  }
};


