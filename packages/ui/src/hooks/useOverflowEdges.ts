import { useCallback, useLayoutEffect, useRef, useState, type RefCallback } from 'react';

export type OverflowAxis = 'x' | 'y';

/** Whether content is clipped past each edge of the scroll axis. */
export interface OverflowEdges {
  start: boolean;
  end: boolean;
}

/**
 * Tracks whether a scroll container overflows at its start/end edge, and writes
 * `data-overflow-start|end` (x) or `data-overflow-top|bottom` (y) onto that same
 * element, so `mask-fade` on it fades only clipped edges (no inheritance trap).
 *
 * A callback ref (React 19 cleanup form) binds the listeners to whichever node is
 * actually mounted, and a per-render layout pass re-measures when children change.
 */
export function useOverflowEdges<T extends HTMLElement = HTMLDivElement>(axis: OverflowAxis = 'x') {
  const [edges, setEdges] = useState<OverflowEdges>({ start: false, end: false });
  const measure = useRef<() => void>(() => {});
  const node = useRef<T | null>(null);
  const ref: RefCallback<T> = useCallback(
    (el: T | null) => {
      node.current = el;
      if (!el) return;
      const [a, b] = axis === 'x' ? (['overflowStart', 'overflowEnd'] as const) : (['overflowTop', 'overflowBottom'] as const);
      const run = () => {
        const pos = axis === 'x' ? el.scrollLeft : el.scrollTop;
        const view = axis === 'x' ? el.clientWidth : el.clientHeight;
        const total = axis === 'x' ? el.scrollWidth : el.scrollHeight;
        const start = pos > 1;
        const end = pos + view < total - 1;
        el.dataset[a] = String(start);
        el.dataset[b] = String(end);
        setEdges((p) => (p.start === start && p.end === end ? p : { start, end }));
      };
      measure.current = run;
      run();
      el.addEventListener('scroll', run, { passive: true });
      const ro = new ResizeObserver(run);
      ro.observe(el);
      if (el.firstElementChild) ro.observe(el.firstElementChild);
      return () => {
        el.removeEventListener('scroll', run);
        ro.disconnect();
        measure.current = () => {};
      };
    },
    [axis],
  );
  useLayoutEffect(() => measure.current());
  return { ref, edges, node };
}
