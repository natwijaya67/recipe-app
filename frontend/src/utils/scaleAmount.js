export function scaleAmount(amount, multiplier) {
  if (!amount) return null;
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  const scaled = num * multiplier;
  return scaled % 1 === 0 ? String(scaled) : scaled.toFixed(2).replace(/\.?0+$/, "");
}