// SettingsFields — settings sections described as data.
//
// A consumer passes sections and fields as plain objects (value + onChange per
// field) and gets the same SettingsSection / SettingsField / SegmentedControl /
// Switch composition the hand-written panels use, without writing any field JSX.
// Persistence stays in the consumer: every field is controlled.

import type { ReactNode } from 'react';
import { Input, Label, Switch, TextField } from '@heroui/react';
import { SettingsField, SettingsSection } from './SettingsLayout';
import { SegmentedControl, type SegmentedControlOption } from '../status/SegmentedControl';
import { cn } from '../../utils/cn';

interface FieldBase {
  /** Stable React key. Falls back to the field's index. */
  id?: string;
  /**
   * Visible field label. Omit it to render the control bare under the section
   * heading (give `ariaLabel` then, so the control still has a name).
   */
  label?: ReactNode;
  /** Accessible name of the control. Defaults to `label` when it is a string. */
  ariaLabel?: string;
  description?: ReactNode;
  disabled?: boolean;
}

export interface SegmentedFieldSpec<T extends string | number = string | number> extends FieldBase {
  kind: 'segmented';
  options: ReadonlyArray<SegmentedControlOption<T>>;
  value: T;
  // Method syntax on purpose: it keeps a narrower setter such as
  // `(next: 'a' | 'b') => void` assignable to the field union.
  onChange(next: T): void;
}

export interface ToggleFieldSpec extends FieldBase {
  kind: 'toggle';
  checked: boolean;
  onChange(next: boolean): void;
  /** State text beside the switch. Default `{ on: 'Enabled', off: 'Disabled' }`. */
  stateLabels?: { on: ReactNode; off: ReactNode };
  /** Small muted line under the state text. */
  hint?: ReactNode;
}

export interface TextFieldSpec extends FieldBase {
  kind: 'text';
  value: string;
  onChange(next: string): void;
  placeholder?: string;
  type?: 'text' | 'url' | 'email' | 'search';
  /** Commit-on-blur hook; the field itself never persists anything. */
  onBlur?: () => void;
}

export type SettingsFieldSpec = SegmentedFieldSpec | ToggleFieldSpec | TextFieldSpec;

export interface SettingsSectionSpec {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  fields: ReadonlyArray<SettingsFieldSpec>;
}

export interface SettingsFieldsProps {
  sections: ReadonlyArray<SettingsSectionSpec>;
  className?: string;
}

const nameOf = (field: FieldBase): string | undefined =>
  field.ariaLabel ?? (typeof field.label === 'string' ? field.label : undefined);

function FieldControl({ field }: { field: SettingsFieldSpec }) {
  switch (field.kind) {
    case 'segmented':
      return (
        <SegmentedControl
          options={field.options}
          value={field.value}
          onChange={(next) => field.onChange(next)}
          label={nameOf(field)}
          disabled={field.disabled}
        />
      );
    case 'toggle': {
      const labels = field.stateLabels ?? { on: 'Enabled', off: 'Disabled' };
      return (
        <Switch
          isSelected={field.checked}
          onChange={(next) => field.onChange(next)}
          isDisabled={field.disabled}
          aria-label={field.label === undefined ? field.ariaLabel : undefined}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-fg">
                {field.checked ? labels.on : labels.off}
              </span>
              {field.hint ? <span className="text-xs text-fg-muted">{field.hint}</span> : null}
            </span>
          </Switch.Content>
        </Switch>
      );
    }
    case 'text':
      return (
        <TextField
          className="w-full space-y-1"
          value={field.value}
          onChange={(next) => field.onChange(next)}
          isDisabled={field.disabled}
          aria-label={field.label === undefined ? field.ariaLabel : undefined}
        >
          {field.label !== undefined ? (
            <Label className="block text-xs font-medium text-fg">{field.label}</Label>
          ) : null}
          {field.description ? <p className="text-xs text-fg-muted">{field.description}</p> : null}
          <Input
            className="w-full text-xs"
            type={field.type ?? 'text'}
            placeholder={field.placeholder}
            spellCheck={false}
            onBlur={field.onBlur}
          />
        </TextField>
      );
  }
}

function Field({ field }: { field: SettingsFieldSpec }) {
  // A text field labels itself (TextField + Label); SettingsField's role=group
  // would only name it twice.
  if (field.kind === 'text') return <FieldControl field={field} />;
  if (field.label === undefined) {
    return (
      <div className="space-y-1">
        {field.description ? <p className="text-xs text-fg-muted">{field.description}</p> : null}
        <FieldControl field={field} />
      </div>
    );
  }
  return (
    <SettingsField label={field.label} description={field.description}>
      <FieldControl field={field} />
    </SettingsField>
  );
}

export function SettingsFields({ sections, className }: SettingsFieldsProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {sections.map((section, s) => (
        <SettingsSection key={section.id ?? s} title={section.title} description={section.description}>
          <div className="space-y-3">
            {section.fields.map((field, f) => (
              <Field key={field.id ?? f} field={field} />
            ))}
          </div>
        </SettingsSection>
      ))}
    </div>
  );
}
