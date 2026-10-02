import { cn } from '../../utils/cn';

export interface SplashLoaderProps {
  label?: string;
  className?: string;
}

/** A single matte ring; styled entirely by the `.splash-*` classes in the kit stylesheet. */
export function SplashLoader({ label = 'Loading workspace…', className }: SplashLoaderProps) {
  return (
    <div
      className={cn('splash-loader', className)}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <div className="splash-center" aria-hidden="true">
        <div className="splash-ring" />
      </div>
      <p className="splash-text">{label}</p>
    </div>
  );
}
