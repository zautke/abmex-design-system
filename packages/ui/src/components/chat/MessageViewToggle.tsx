import { ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { cn } from '../../utils/cn';

export type MessageViewMode = 'text' | 'json';

export interface MessageViewToggleProps {
  mode: MessageViewMode;
  onChange: (mode: MessageViewMode) => void;
  className?: string;
}

/** Switches the message stream between rendered text and verbatim JSON. */
export function MessageViewToggle({ mode, onChange, className }: MessageViewToggleProps) {
  return (
    <ToggleButtonGroup
      size="sm"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[mode]}
      onSelectionChange={(keys) => {
        const next = [...keys][0];
        if (next === 'text' || next === 'json') onChange(next);
      }}
      aria-label="Message view"
      className={cn('text-xs uppercase tracking-[0.14em]', className)}
    >
      <ToggleButton id="text">Text</ToggleButton>
      <ToggleButton id="json">
        <ToggleButtonGroup.Separator />
        JSON
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
