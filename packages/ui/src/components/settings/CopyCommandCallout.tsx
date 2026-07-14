// CopyCommandCallout — generalized from OllamaOriginsHelper.
//
// The source knew about Ollama, CORS, HTTP 403, and how to build two specific
// shell commands. It knows none of that now. It renders a titled callout with a
// list of copyable commands and optional links; the app decides *when* to show
// it (the 403 predicate stays in the app) and *what* the strings say.
//
// Copy state lives in the shared CopyButton — one confirmation timer, one
// clipboard fallback, one place.

import { Alert } from '@heroui/react';
import { CopyButton } from '../../primitives/CopyButton';
import { cn } from '../../utils/cn';

export type CalloutStatus = 'default' | 'accent' | 'success' | 'warning' | 'danger';

export interface CalloutCommand {
  /** Button text, e.g. "Copy scoped command". */
  label: string;
  /** The literal text placed on the clipboard. */
  command: string;
}

export interface CalloutLink {
  label: string;
  url: string;
}

export interface CopyCommandCalloutProps {
  title: string;
  description?: string;
  commands: ReadonlyArray<CalloutCommand>;
  /** 'compact' drops the description and the rendered command text. */
  variant?: 'compact' | 'full';
  /** Visual severity. Defaults to 'warning' — a callout usually means something broke. */
  status?: CalloutStatus;
  links?: ReadonlyArray<CalloutLink>;
  /**
   * WIRING: clipboard write. Defaults to `navigator.clipboard.writeText`.
   * Override where `navigator.clipboard` is unavailable (non-secure contexts)
   * or to observe copies in tests.
   */
  onCopy?: (value: string) => Promise<void>;
  className?: string;
}

export function CopyCommandCallout({
  title,
  description,
  commands,
  variant = 'full',
  status = 'warning',
  links,
  onCopy,
  className,
}: CopyCommandCalloutProps) {
  const full = variant === 'full';

  return (
    <Alert status={status} className={cn('text-[11px]', className)}>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        {full && description ? <Alert.Description>{description}</Alert.Description> : null}

        <div className="mt-2 flex flex-col gap-2">
          {commands.map((cmd) => (
            <div key={cmd.label} className="flex flex-wrap items-center gap-2">
              <CopyButton
                value={cmd.command}
                label={cmd.label}
                copiedLabel={`Copied — ${cmd.label}`}
                onCopy={onCopy}
              />
              {full ? (
                <code className="min-w-0 flex-1 truncate rounded bg-md-code-inline-bg px-1.5 py-1 font-mono text-[10px] text-md-code-inline-text">
                  {cmd.command}
                </code>
              ) : null}
            </div>
          ))}
        </div>

        {links && links.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-3">
            {links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </Alert.Content>
    </Alert>
  );
}
