// Format numbers for display
export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
