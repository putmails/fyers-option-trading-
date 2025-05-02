// Import required modules
import { fyersModel } from 'fyers-web-sdk-v3';
import Cookies from 'js-cookie';

// Create a new instance of FyersAPI
const fyers = new fyersModel();

// Initialize Fyers configuration
const initFyers = () => {
  // Set your APPID obtained from Fyers
  fyers.setAppId(import.meta.env.VITE_FYERS_APP_ID);

  // Set the RedirectURL where the authorization code will be sent
  fyers.setRedirectUrl(import.meta.env.VITE_FYERS_REDIRECT_URI);
};

// Initialize on module load


/**
 * Generate the URL to initiate the OAuth2 authentication process
 * @returns {string} The authorization URL
 */
export const generateAuthCodeUrl = () => {
  initFyers();
  const generateAuthcodeURL = fyers.generateAuthCode();
  console.log(
    '🚀 ~ generateAuthCodeUrl ~ generateAuthcodeURL:',
    generateAuthcodeURL
  );
  return generateAuthcodeURL;
};

/**
 * Get access token using auth code and secret key
 * @param {string} authCode - Authorization code from Fyers redirect
 * @param {string} secretKey - Secret key from environment variables
 * @returns {Promise<object>} Response containing access token
 */
export const getAccessToken = async (authCode, secretKey) => {
  try {
    initFyers();
    const response = await fyers.generate_access_token({
      secret_key: secretKey,
      auth_code: authCode,
    });

    if (response.s === 'ok' && response.access_token) {
      // Store the access token in cookies
      Cookies.set('fyersAccessToken', response.access_token, { expires: 1 }); // 1 day expiry
      Cookies.set('fyersRefreshToken', response.refresh_token || '', {
        expires: 7,
      }); // 7 days expiry if available
      return response;
    } else {
      throw new Error(response.message || 'Failed to get access token');
    }
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  return !!Cookies.get('fyersAccessToken');
};

/**
 * Logout user by removing cookies
 */
export const logout = () => {
  Cookies.remove('fyersAccessToken');
  Cookies.remove('fyersRefreshToken');
};

/**
 * Get the stored access token
 * @returns {string|null} Access token or null
 */
export const getStoredAccessToken = () => {
  return Cookies.get('fyersAccessToken') || null;
};
