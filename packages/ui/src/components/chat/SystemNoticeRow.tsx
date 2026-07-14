import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface SystemNoticeRowProps {
  children: ReactNode;
  className?: string;
}

/**
 * Centered, italic aside in the message stream — an interruption, a truncation,
 * anything spoken by the app rather than by a participant. (Was `OOCRow`.)
 */
export function SystemNoticeRow({ children, className }: SystemNoticeRowProps) {
  return (
    <li className="flex justify-center">
      <div className={cn('px-3 py-1 text-xs italic text-[var(--oocm-text)]', className)}>
        {children}
      </div>
    </li>
  );
}
