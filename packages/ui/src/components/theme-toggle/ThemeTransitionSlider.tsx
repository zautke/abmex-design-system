import { useEffect, useId, useState, type ComponentPropsWithRef } from 'react';
import { cn } from '../../utils/cn';
import { parseCssTime } from './controller';

export interface ThemeTransitionSliderProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  /** Controlled duration in ms. Omit to start from the computed `--theme-transition-duration`. */
  value?: number;
  /** Called with the new duration (ms) so the app can persist it. */
  onValueChange?: (ms: number) => void;
  /** Visible label. Default "Theme transition". */
  label?: string;
}

const MIN = 150;
const MAX = 1000;
const STEP = 25;
const VAR = '--theme-transition-duration';

/** Native range (150–1000 ms, step 25) bound to `--theme-transition-duration` on `<html>`. */
export function ThemeTransitionSlider({
  value,
  onValueChange,
  label = 'Theme transition',
  className,
  ...rest
}: ThemeTransitionSliderProps) {
  const id = useId();
  const [inner, setInner] = useState(550);
  const ms = value ?? inner;

  useEffect(() => {
    const root = document.documentElement;
    if (value === undefined) {
      const current = parseCssTime(getComputedStyle(root).getPropertyValue(VAR));
      if (current > 0) setInner(current);
    } else {
      root.style.setProperty(VAR, `${value}ms`);
    }
  }, [value]);

  return (
    <div className={cn('flex items-center gap-3', className)} {...rest}>
      <label htmlFor={id} className="whitespace-nowrap text-sm text-fg">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={MIN}
        max={MAX}
        step={STEP}
        value={ms}
        aria-valuetext={`${ms} milliseconds`}
        onChange={(e) => {
          const next = Number(e.target.value);
          document.documentElement.style.setProperty(VAR, `${next}ms`);
          setInner(next);
          onValueChange?.(next);
        }}
        className="h-1.5 w-28 cursor-pointer accent-[var(--primary)]"
      />
      <output htmlFor={id} className="min-w-[4.5ch] text-right font-[family-name:var(--font-mono)] text-xs tabular-nums text-fg-muted">
        {ms}ms
      </output>
    </div>
  );
}
