// Generic button group — single-select, value/onChange controlled.
// Style and a11y contract lifted from src/components/settings/ToolsTab.tsx
// (the two inline copies it replaced). Reusable for future settings panels.

import type { ReactNode } from 'react';

export interface ButtonGroupOption<T extends string | number> {
  id: T;
  label: ReactNode;
}

export interface ButtonGroupProps<T extends string | number> {
  options: ReadonlyArray<ButtonGroupOption<T>>;
  value: T;
  onChange: (next: T) => void;
  label?: string;
}

export function ButtonGroup<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: ButtonGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={String(opt.id)}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={active}
            className={`rounded border px-2 py-1 text-xs transition-colors ${
              active
                ? 'border-tictac-orange bg-tictac-orange text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            style={
              active
                ? {
                    background: 'var(--color-tictac-orange)',
                    borderColor: 'var(--color-tictac-orange)',
                  }
                : undefined
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
