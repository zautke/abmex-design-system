// Internal helpers — NOT part of the @abmex/ui public API. Live outside the
// `./components/*` export glob so they stay package-private; consumed only by
// ColorSystem. Unit-tested directly via the repo source path.

/**
 * Guard a channel value before it reaches a range input / readout.
 *
 * culori conversions for out-of-gamut colors can yield three distinct
 * hazards, all handled here:
 *  - NaN / ±Infinity      → fall back to `min`
 *  - negative zero        → normalized to +0
 *  - finite-but-off-scale → clamped into `[min, max]` (an out-of-gamut OKLCH
 *    color produces a finite RGB/HSL value outside the slider bounds, e.g.
 *    `r = 1.32` for a 0–255 channel; an unclamped readout would show "337").
 *
 * @param value raw channel value
 * @param min   channel lower bound — also the non-finite fallback
 * @param max   channel upper bound
 */
export function normalizeChannelValue(
  value: number,
  min: number,
  max: number,
): number {
  const finite = Number.isFinite(value) ? value : min;
  const clamped = Math.min(max, Math.max(min, finite));
  // Sign-normalize after clamping so a -0 value or bound can't escape.
  return Object.is(clamped, -0) ? 0 : clamped;
}

/**
 * Format a (pre-normalized) channel value for display: integers stay bare,
 * fractionals go to 2 dp. A "-0.00" rounding artifact is stripped to "0.00".
 */
export function formatChannelDisplay(value: number): string {
  if (Number.isInteger(value)) return String(value);
  const fixed = value.toFixed(2);
  return fixed === '-0.00' ? '0.00' : fixed;
}
