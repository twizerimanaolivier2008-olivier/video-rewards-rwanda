export const parseMinorUnits = (value) => {
  const input = String(value);
  if (!/^\d{1,16}(?:\.\d{1,2})?$/.test(input)) {
    throw new TypeError('Money values must be non-negative decimals with at most two fractional digits.');
  }
  const [whole, fraction = ''] = input.split('.');
  const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (amount <= 0n) throw new RangeError('Ledger entry amounts must be greater than zero.');
  return amount;
};
