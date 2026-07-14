import { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { Check, Copy } from 'lucide-react';
import { cn } from '../utils/cn';

export interface CopyButtonProps {
  /** Text placed on the clipboard when pressed. */
  value: string;
  label?: string;
  copiedLabel?: string;
  /** Hide the text, keep the icon. The accessible name still comes from `label`. */
  iconOnly?: boolean;
  /** How long the copied-confirmation persists. */
  resetMs?: number;
  /**
   * Clipboard write. Defaults to `navigator.clipboard.writeText`.
   * Injected so the kit stays testable and survives non-secure contexts,
   * where `navigator.clipboard` is undefined.
   */
  onCopy?: (value: string) => Promise<void>;
  className?: string;
}

async function writeToClipboard(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied!',
  iconOnly = false,
  resetMs = 2000,
  onCopy = writeToClipboard,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Copying, then unmounting inside the reset window, must not set state on a
  // dead component — the confirmation is a timer the component owns.
  useEffect(() => () => clearTimeout(timer.current), []);

  const handlePress = async () => {
    try {
      await onCopy(value);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), resetMs);
    } catch {
      // A rejected clipboard write is a denied permission, not a bug. Leave the
      // button in its resting state rather than lying with a success tick.
      setCopied(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onPress={handlePress}
      aria-label={label}
      className={cn('gap-1.5', className)}
    >
      {copied ? (
        <Check className={cn('h-3.5 w-3.5', 'text-md-code-copied-icon')} />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {!iconOnly && <span>{copied ? copiedLabel : label}</span>}
    </Button>
  );
}
