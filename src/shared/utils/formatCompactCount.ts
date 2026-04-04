/** Compact display for counts: 999 → "999", 1500 → "1.5k", 2_000_000 → "2m". */
export function formatCompactCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0';
  const x = Math.floor(n);
  if (x < 1000) return String(x);
  if (x < 1_000_000) {
    const k = x / 1000;
    return `${k < 10 ? oneDecimal(k) : Math.floor(k)}k`;
  }
  const m = x / 1_000_000;
  return `${m < 10 ? oneDecimal(m) : Math.floor(m)}m`;
}

function oneDecimal(v: number): string {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
