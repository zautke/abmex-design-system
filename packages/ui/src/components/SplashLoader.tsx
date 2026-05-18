interface Props {
  label?: string;
}

export function SplashLoader({ label = 'Loading workspace…' }: Props) {
  return (
    <div className="splash-loader" role="status" aria-label={label} aria-live="polite">
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
