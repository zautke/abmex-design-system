// SecretKeyInput — a labelled password field with a reveal toggle and an
// optional "where do I get one of these" link. Was `KeyInput` in ToolsTab.
//
// Reveal state is controlled by the consumer so a panel with several key fields
// can enforce its own policy (one revealed at a time, reveal-all, reset on tab
// change) without this component holding an opinion.

import { Button, InputGroup, Label, TextField } from '@heroui/react';
import { ExternalLink, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SecretKeyHelpLink {
  label: string;
  url: string;
}

export interface SecretKeyInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (next: string) => void;
  revealed: boolean;
  onToggleReveal: () => void;
  /** "Get a key from …" affordance. Opens in a new tab. */
  helpLink?: SecretKeyHelpLink;
  /** Commit-on-blur hook. The field itself never persists anything. */
  onBlur?: () => void;
  isDisabled?: boolean;
  className?: string;
}

export function SecretKeyInput({
  label,
  placeholder,
  value,
  onChange,
  revealed,
  onToggleReveal,
  helpLink,
  onBlur,
  isDisabled = false,
  className,
}: SecretKeyInputProps) {
  return (
    <TextField
      className={cn('w-full', className)}
      value={value}
      onChange={onChange}
      isDisabled={isDisabled}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-fg">{label}</Label>
        {helpLink ? (
          <a
            href={helpLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-xs text-fg-muted hover:text-fg hover:underline"
          >
            {helpLink.label}
            <ExternalLink size={10} />
          </a>
        ) : null}
      </div>

      <InputGroup fullWidth>
        <InputGroup.Input
          type={revealed ? 'text' : 'password'}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          onBlur={onBlur}
          className="w-full font-mono text-2xs"
        />
        <InputGroup.Suffix className="pr-0">
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            // Kept out of the tab order, as in the source: Tab from the key field
            // should reach the next field, not the reveal toggle.
            excludeFromTabOrder
            aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
            onPress={onToggleReveal}
          >
            {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
    </TextField>
  );
}
