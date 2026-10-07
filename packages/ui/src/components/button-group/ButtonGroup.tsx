import { createContext, type ComponentPropsWithRef } from 'react';
import { cn } from '../../utils/cn';

/** True inside a ButtonGroup: kit segments (OrientationToggle, Switcher) drop their own frame. */
export const ButtonGroupContext = createContext(false);

export interface ButtonGroupProps extends ComponentPropsWithRef<'div'> {
  /** Names the group for assistive tech. */
  'aria-label'?: string;
}

/**
 * Joined-segment container for icon buttons: one frame, hairline dividers between
 * direct children, no inner radii. Children keep their own semantics (buttons,
 * radiogroups, menus); the group only adds `role="group"`.
 */
export function ButtonGroup({ className, children, ...rest }: ButtonGroupProps) {
  return (
    <ButtonGroupContext.Provider value>
      <div
        role="group"
        data-slot="button-group"
        className={cn(
          'inline-flex items-stretch overflow-hidden rounded-[var(--radius)] bg-field ring-1 ring-border',
          '*:rounded-none [&>*+*]:border-l [&>*+*]:border-border',
          // overflow-hidden would clip the kit's offset focus outline; draw it inside instead.
          '[&_:focus-visible]:outline-offset-[-2px]!',
          'forced-colors:border forced-colors:border-[ButtonBorder]',
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    </ButtonGroupContext.Provider>
  );
}
