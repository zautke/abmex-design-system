import { useCallback, useState } from 'react';

/** Matches the `motion-safe:` variant: no exit animation will fire, so unmount at once. */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Enter/exit motion for keyed list items, on the kit's `pop` tokens
 * (`--animate-pop-in` / `--animate-pop-out` in styles/tailwind.css).
 *
 * Mounting items get `motion-safe:animate-pop-in`. `start(id)` flips the item
 * to `motion-safe:animate-pop-out` and calls `onRemoved(id)` when that
 * animation ends — or immediately under reduced motion, where nothing would
 * end. The caller keeps the item rendered until `onRemoved` fires.
 */
export function useExitAnimation(onRemoved?: (id: string) => void) {
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(() => new Set());

  const finish = useCallback(
    (id: string) => {
      setLeaving((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      onRemoved?.(id);
    },
    [onRemoved],
  );

  const start = useCallback(
    (id: string) => {
      if (prefersReducedMotion()) {
        onRemoved?.(id);
        return;
      }
      setLeaving((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    },
    [onRemoved],
  );

  const className = useCallback(
    (id: string) => (leaving.has(id) ? 'motion-safe:animate-pop-out' : 'motion-safe:animate-pop-in'),
    [leaving],
  );

  const onAnimationEnd = useCallback(
    (id: string) => (e: React.AnimationEvent) => {
      if (e.target === e.currentTarget && e.animationName === 'pop-out') finish(id);
    },
    [finish],
  );

  return { start, className, onAnimationEnd, isLeaving: (id: string) => leaving.has(id) };
}
