// Parse any amount string to a float — handles "1 1/2", "3/4", "1.5", "2"
function parseAmount(str) {
  if (!str && str !== 0) return null;
  const s = String(str).trim();

  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);

  const fraction = s.match(/^(\d+)\/(\d+)$/);
  if (fraction) return parseInt(fraction[1]) / parseInt(fraction[2]);

  const num = parseFloat(s);
  return isNaN(num) ? null : num;
}

// Convert a float to a mixed fraction string using common cooking fractions
function toFraction(num) {
  if (num === 0) return "0";
  const whole = Math.floor(num);
  const decimal = num - whole;

  if (decimal < 0.01) return String(whole);

  const commonFractions = [
    [1, 8], [1, 4], [1, 3], [3, 8], [1, 2],
    [5, 8], [2, 3], [3, 4], [7, 8],
  ];

  let best = null;
  let bestDiff = Infinity;
  for (const [n, d] of commonFractions) {
    const diff = Math.abs(decimal - n / d);
    if (diff < bestDiff) { bestDiff = diff; best = [n, d]; }
  }

  // Fall back to decimal if no fraction is close enough
  if (bestDiff > 0.05) {
    const raw = num % 1 === 0 ? String(num) : num.toFixed(2).replace(/\.?0+$/, "");
    return raw;
  }

  const [n, d] = best;
  const fracStr = `${n}/${d}`;
  return whole === 0 ? fracStr : `${whole} ${fracStr}`;
}

export function scaleAmount(amount, multiplier) {
  if (!amount && amount !== 0) return null;
  const num = parseAmount(amount);
  if (num === null) return String(amount); // non-numeric — return as-is
  const scaled = num * multiplier;
  return toFraction(scaled);
}
