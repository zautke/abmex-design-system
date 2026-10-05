// Layout primitives for the settings family.
//
// Every settings tab in the source app repeated the same three shapes: an
// uppercase section heading with a small explanatory paragraph, a labelled
// field block wrapping a non-self-labelling control (ButtonGroup, switch), and
// a two-column list row. They are extracted here so the family stays visually
// consistent without each panel re-deriving the spacing and type scale.

import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface SettingsSectionProps {
  title: ReactNode;
  /** Small explanatory copy under the heading. */
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({ title, description, children, className }: SettingsSectionProps) {
  return (
    <section className={className}>
      <h3 className="mb-1 text-xs font-semibold tracking-wide text-fg-muted uppercase">{title}</h3>
      {description ? <p className="mb-3 text-xs text-fg-muted">{description}</p> : null}
      {children}
    </section>
  );
}

export interface SettingsFieldProps {
  /**
   * Names the control group. Rendered as visible text and echoed onto the
   * wrapper's `aria-label`, because the controls this wraps (ButtonGroup,
   * switch rows) carry no native <label> association of their own.
   */
  label: ReactNode;
  /** Accessible name. Defaults to `label` when it is a plain string. */
  ariaLabel?: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SettingsField({
  label,
  ariaLabel,
  description,
  children,
  className,
}: SettingsFieldProps) {
  const groupLabel = ariaLabel ?? (typeof label === 'string' ? label : undefined);

  return (
    <div className={cn('space-y-1', className)}>
      <span className="block text-xs font-medium text-fg">{label}</span>
      {description ? <p className="text-xs text-fg-muted">{description}</p> : null}
      <div role="group" aria-label={groupLabel}>
        {children}
      </div>
    </div>
  );
}

export interface SettingsRowProps {
  /** Leading content — identity of the row (name, status dot). */
  children: ReactNode;
  /** Trailing content — metadata or actions, right-aligned. */
  trailing?: ReactNode;
  className?: string;
}

export function SettingsRow({ children, trailing, className }: SettingsRowProps) {
  return (
    <div className={cn('flex items-center justify-between gap-2 px-2 py-1.5', className)}>
      <div className="flex min-w-0 items-center gap-2">{children}</div>
      {trailing ? (
        <div className="flex flex-shrink-0 items-center gap-2 text-xs text-fg-muted">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

/** Bordered, divided container for a stack of SettingsRow items. */
export function SettingsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul className={cn('divide-y divide-border rounded border border-border', className)}>
      {children}
    </ul>
  );
}
