import { cn } from '../../utils/cn';

export interface AppFooterProps {
  // WIRING: the consumer supplies the version string (the package reads no
  // manifest and no build metadata of its own).
  version: string;
  className?: string;
}

export function AppFooter({ version, className }: AppFooterProps) {
  return (
    <footer className={cn('flex justify-center py-1.5', className)}>
      <div className="flex w-[90vw] items-center border-t border-border pt-1.5">
        <span className="font-mono text-2xs text-fg-muted">({version})</span>
      </div>
    </footer>
  );
}
