import { Typography } from '@mui/material';
import { formatNumber } from '../../../utils/common.utils';

// Format percentage change for display with color
export const ChangeFormat = (change) => {
  if (change === null || change === undefined) return '-';

  const color = change >= 0 ? 'success.main' : 'error.main';
  const prefix = change >= 0 ? '+' : '';

  return (
    <Typography component="span" color={color} fontWeight="medium">
      {prefix}
      {formatNumber(change, 2)}%
    </Typography>
  );
};
