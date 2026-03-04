export const ROUNDING_MODES = {
  UP_1: 'up_1',
  UP_5: 'up_5'
};

export const roundAmount = (amount, mode = ROUNDING_MODES.UP_1) => {
  const val = parseFloat(amount);
  if (isNaN(val)) return 0;
  switch (mode) {
    case ROUNDING_MODES.UP_5: return Math.ceil(val / 5) * 5;
    case ROUNDING_MODES.UP_1:
    default: return Math.ceil(val);
  }
};
