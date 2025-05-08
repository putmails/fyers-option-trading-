// Format numbers for display
export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};


export const getUnixTimestampNDaysAgo = (n) => {
  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - n);
  return Math.floor(past.getTime() / 1000);
}

export const getTodayUnixTimestamp = () => {
  return Math.floor(Date.now() / 1000);
}