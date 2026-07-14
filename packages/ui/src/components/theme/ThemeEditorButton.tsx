import { SlidersHorizontal } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ThemeEditorButtonProps {
  onPress: () => void;
  isOpen?: boolean;
  label?: string;
  className?: string;
}

/**
 * Toggle for the theme editor panel.
 *
 * A plain `<button>` rather than HeroUI's, on purpose: this is one of the header's
 * `.icon-btn-32` chrome buttons, whose 32×32 box, hover tint, and `data-active`
 * fill are defined in the kit's stylesheet. HeroUI's Button would layer its own
 * sizing and variant classes on top, and the two would fight. The rule this
 * follows: use HeroUI where it supplies behavior (menus, fields, overlays), not
 * where it would merely re-skin a control that already has a skin.
 */
export function ThemeEditorButton({
  onPress,
  isOpen = false,
  label = 'Toggle Theme Editor',
  className,
}: ThemeEditorButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn('icon-btn-32', className)}
      data-active={isOpen || undefined}
      aria-label={label}
      aria-pressed={isOpen}
      title={label}
    >
      <SlidersHorizontal size={18} aria-hidden />
    </button>
  );
}
