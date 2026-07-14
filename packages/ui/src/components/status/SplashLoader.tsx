import { cn } from '../../utils/cn';

export interface SplashLoaderProps {
  label?: string;
  className?: string;
}

/**
 * The orb field is driven entirely by the `.splash-*` classes and the
 * `@property --splash-c1..c4` registrations in the kit stylesheet — animating
 * registered custom properties is what makes the colors tween instead of
 * snapping. Those must stay in CSS; do not reimplement them in JS.
 */
export function SplashLoader({ label = 'Loading workspace…', className }: SplashLoaderProps) {
  return (
    <div
      className={cn('splash-loader', className)}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <div className="splash-orbs" aria-hidden="true">
        <div className="splash-orb splash-orb--a" />
        <div className="splash-orb splash-orb--b" />
        <div className="splash-orb splash-orb--c" />
        <div className="splash-orb splash-orb--d" />
      </div>
      <div className="splash-center" aria-hidden="true">
        <div className="splash-ring" />
      </div>
      <p className="splash-text">{label}</p>
    </div>
  );
}
