import Cookies from 'js-cookie';

/**
 * Set a cookie value
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Expiry in days
 */
export const setCookie = (name, value, days = 1) => {
  Cookies.set(name, value, { expires: days });
};

/**
 * Get a cookie value
 * @param {string} name - Cookie name
 * @returns {string|undefined} Cookie value
 */
export const getCookie = (name) => {
  return Cookies.get(name);
};

/**
 * Remove a cookie
 * @param {string} name - Cookie name
 */
export const removeCookie = (name) => {
  Cookies.remove(name);
};

/**
 * Check if a cookie exists
 * @param {string} name - Cookie name
 * @returns {boolean} Cookie exists
 */
export const hasCookie = (name) => {
  return !!Cookies.get(name);
};
