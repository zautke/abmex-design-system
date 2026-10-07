/**
 * Runs before first paint (inline in `<head>`): applies the stored theme — or the
 * system one — so the page never flashes the wrong palette, and adds
 * `html.no-transition` until the app calls `releaseNoTransition()`.
 *
 * Self-contained on purpose: `themePrePaintScript` stringifies it. Keep it free of
 * imports and closures.
 */
export function themePrePaint(
  storageKey: string,
  attribute = 'class',
  values: { light: string; dark: string } = { light: 'light', dark: 'dark' },
) {
  const el = document.documentElement;
  let pref = 'system';
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (stored && (stored.pref === 'light' || stored.pref === 'dark')) pref = stored.pref;
  } catch {
    // Unreadable storage: fall through to the system preference.
  }
  const resolved: 'light' | 'dark' =
    pref === 'light' || pref === 'dark' ? pref : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  if (attribute === 'class') {
    el.classList.remove(values.light, values.dark);
    el.classList.add(values[resolved]);
  } else {
    el.setAttribute(attribute, values[resolved]);
  }
  el.style.colorScheme = resolved;
  el.classList.add('no-transition');
}

/**
 * The pre-paint snippet as an inline-script string:
 * `<script>{themePrePaintScript('app:theme')}</script>`. The attribute cannot be read
 * from CSS this early, so pass it when it is not `'class'`.
 */
export function themePrePaintScript(
  storageKey: string,
  attribute = 'class',
  values: { light: string; dark: string } = { light: 'light', dark: 'dark' },
) {
  return `(${themePrePaint.toString()})(${JSON.stringify(storageKey)},${JSON.stringify(attribute)},${JSON.stringify(values)});`;
}
