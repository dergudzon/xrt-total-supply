/** Sum an arbitrary number of planck values (string|bigint) -> BigInt. */
export function sumPlanck(...values) {
  return values.reduce((acc, v) => acc + BigInt(v ?? 0n), 0n);
}
