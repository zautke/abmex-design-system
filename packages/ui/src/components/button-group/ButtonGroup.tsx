import { createContext, type ComponentPropsWithRef } from 'react';
import { cn } from '../../utils/cn';

/** True inside a joined ButtonGroup: kit segments (OrientationToggle, Switcher) drop their own frame. */
export const ButtonGroupContext = createContext(false);

export type ButtonGroupVariant = 'joined' | 'spaced';

export interface ButtonGroupProps extends ComponentPropsWithRef<'div'> {
  /** Names the group for assistive tech. */
  'aria-label'?: string;
  /**
   * `joined` (default): one frame, hairline dividers, no inner radii — segments fuse.
   * `spaced`: the separator is pure negative space — no frame, no divider, no container
   * chrome; each child keeps its own surface and the gap IS the separation.
   */
  variant?: ButtonGroupVariant;
}

/**
 * Container for icon buttons. Children keep their own semantics (buttons,
 * radiogroups, menus); the group only adds `role="group"` and the chosen
 * separation style.
 */
export function ButtonGroup({ className, children, variant = 'joined', ...rest }: ButtonGroupProps) {
  const joined = variant === 'joined';
  return (
    <ButtonGroupContext.Provider value={joined}>
      <div
        role="group"
        data-slot="button-group"
        data-variant={variant}
        className={cn(
          'inline-flex',
          joined
            ? [
                'items-stretch overflow-hidden rounded-[var(--radius)] bg-field ring-1 ring-border',
                '*:rounded-none [&>*+*]:border-l [&>*+*]:border-border',
                // overflow-hidden would clip the kit's offset focus outline; draw it inside instead.
                '[&_:focus-visible]:outline-offset-[-2px]!',
                'forced-colors:border forced-colors:border-[ButtonBorder]',
              ]
            : 'items-center gap-2',
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    </ButtonGroupContext.Provider>
  );
}
