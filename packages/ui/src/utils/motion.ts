/**
 * True when the user asked for reduced motion. The kit's enter/exit classes
 * are `motion-safe:`, so no animation (and no `animationend`) fires then —
 * hosts that wait for an exit animation must skip straight to removal.
 */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
