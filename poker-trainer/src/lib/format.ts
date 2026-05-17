export function formatBB(bb: number, fractionDigits = 2): string {
  if (Number.isInteger(bb)) return `${bb} BB`;
  return `${bb.toFixed(fractionDigits)} BB`;
}

export function formatPct(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatFreq(freq: number, fractionDigits = 0): string {
  return formatPct(freq * 100, fractionDigits);
}
