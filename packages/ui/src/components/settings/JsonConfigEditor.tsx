// JsonConfigEditor — controlled JSON textarea with Save / Reset / Export /
// Import and a 2-vs-4-space indent toggle. Tab inserts spaces instead of moving
// focus (useTabIndent).
//
// The editor validates nothing. `error` is a prop: the consumer parses, checks
// against whatever schema it owns, and hands back a message. That is what keeps
// this reusable for any JSON config, not just MCP servers.

import { useRef, useState } from 'react';
import { Button, TextArea } from '@heroui/react';
import { useTabIndent, type TabIndentSpaces } from '../../hooks/useTabIndent';
import { SegmentedControl } from '../status/SegmentedControl';
import { cn } from '../../utils/cn';

const INDENT_OPTIONS: ReadonlyArray<{ id: TabIndentSpaces; label: string }> = [
  { id: 2, label: '2' },
  { id: 4, label: '4' },
];

export interface JsonConfigEditorProps {
  text: string;
  onTextChange: (next: string) => void;
  /**
   * WIRING: validation result, not a validation rule. Non-null disables Save and
   * renders the message. The consumer owns the parser and the schema.
   */
  error: string | null;
  /** WIRING: false until the consumer's async load resolves; disables the editor. */
  isLoaded: boolean;
  /** WIRING: persist the current text. */
  onSave: () => void;
  /** WIRING: discard edits and reload from the source of truth. */
  onReset: () => void;
  /** WIRING: serialize to a file. Blob/URL/download plumbing stays in the app. */
  onExport: () => void;
  /** WIRING: the consumer reads the File and pushes the text back via onTextChange. */
  onImport: (file: File) => void;
  ariaLabel: string;
  rows?: number;
  className?: string;
}

export function JsonConfigEditor({
  text,
  onTextChange,
  error,
  isLoaded,
  onSave,
  onReset,
  onExport,
  onImport,
  ariaLabel,
  rows = 12,
  className,
}: JsonConfigEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [indentSpaces, setIndentSpaces] = useState<TabIndentSpaces>(2);
  const onKeyDown = useTabIndent(textareaRef, text, onTextChange, indentSpaces);

  return (
    <div className={className}>
      <TextArea
        ref={textareaRef}
        aria-label={ariaLabel}
        spellCheck={false}
        rows={rows}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={!isLoaded}
        fullWidth
        className="resize-y font-mono text-2xs"
      />

      {error ? <p className="mt-1 text-xs text-conn-disconnected">{error}</p> : null}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          aria-label="Save config"
          isDisabled={!isLoaded || error !== null}
          onPress={onSave}
        >
          Save config
        </Button>
        <Button
          size="sm"
          variant="secondary"
          aria-label="Reset"
          isDisabled={!isLoaded}
          onPress={onReset}
        >
          Reset
        </Button>
        <Button size="sm" variant="secondary" aria-label="Export" onPress={onExport}>
          Export
        </Button>

        {/* Native <label> + hidden file input: the only way to open a file picker
            without a user-gesture-losing indirection. Keyboard-reachable via the
            input, which stays in the tab order. */}
        <label
          className={cn(
            'cursor-pointer rounded border border-border-strong bg-field px-2 py-1 text-xs text-fg',
            'hover:bg-surface-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus',
          )}
        >
          Import
          <input
            type="file"
            accept="application/json,.json"
            aria-label="Import config"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.target.value = '';
            }}
          />
        </label>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs tracking-wide text-fg-muted uppercase">indent</span>
          <SegmentedControl
            options={INDENT_OPTIONS}
            value={indentSpaces}
            onChange={setIndentSpaces}
            label="Indent size"
          />
        </div>
      </div>
    </div>
  );
}
