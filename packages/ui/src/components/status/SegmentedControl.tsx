// Single-select segmented control — value/onChange controlled.
//
// This is what `components/ui/ButtonGroup.tsx` always was: a segmented control,
// not a layout wrapper. HeroUI v3 ships its own `ButtonGroup` (which *is* a
// layout wrapper), so the name is renamed here to end the collision. The old
// `ButtonGroupOption` / `ButtonGroupProps` type names remain exported as
// deprecated aliases below.

import { ToggleButton, ToggleButtonGroup } from '@heroui/react';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface SegmentedControlOption<T extends string | number> {
  id: T;
  label: ReactNode;
}

export interface SegmentedControlProps<T extends string | number> {
  options: ReadonlyArray<SegmentedControlOption<T>>;
  value: T;
  onChange: (next: T) => void;
  /** Accessible group name. Required in practice — the group has no visible label. */
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  label,
  size = 'sm',
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  // React Aria keys are stringified; keep a map back to the caller's numeric or
  // string-literal union so `onChange` returns the exact `T` it was given.
  const byKey = new Map<string, T>(options.map((option) => [String(option.id), option.id]));

  function handleSelectionChange(keys: Set<unknown>): void {
    for (const key of keys) {
      const next = byKey.get(String(key));
      // disallowEmptySelection guarantees exactly one key, but be defensive.
      if (next !== undefined) {
        onChange(next);
        return;
      }
    }
  }

  return (
    <ToggleButtonGroup
      aria-label={label}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[String(value)]}
      onSelectionChange={handleSelectionChange}
      size={size}
      isDisabled={disabled}
      className={cn('flex-wrap', className)}
    >
      {options.map((option, index) => (
        <ToggleButton key={String(option.id)} id={String(option.id)}>
          {index > 0 && <ToggleButtonGroup.Separator />}
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

/** @deprecated Use {@link SegmentedControlOption}. */
export type ButtonGroupOption<T extends string | number> = SegmentedControlOption<T>;

/** @deprecated Use {@link SegmentedControlProps}. */
export type ButtonGroupProps<T extends string | number> = SegmentedControlProps<T>;
