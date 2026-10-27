// MUI 7 adapter: ThemeOptions whose palette is ABMEX role variables, so one MUI
// theme follows every family (phosphor, cev, …) and both modes from CSS alone.
// Usage: createTheme(muiThemeOptions(), appOverrides) — createTheme deep-merges.
// Pair with <InitColorSchemeScript attribute='[data-mode="%s"]' defaultMode="dark" />
// and import a family's tokens (e.g. "@abmex/themes/phosphor/phosphor.tailwind.css").
// Requires @mui/material >= 7.3 (nativeColor lets MUI derive tones from var()).

const v = (role: string) => `var(--${role})`;
const intent = (role: string) => ({ main: v(role), dark: v(`${role}-hover`), contrastText: v(`${role}-fg`) });

const palette = {
  primary: intent('primary'),
  secondary: intent('emphasis'),
  error: intent('danger'),
  warning: intent('warning'),
  success: intent('success'),
  info: intent('info'),
  background: { default: v('bg'), paper: v('surface') },
  text: { primary: v('fg'), secondary: v('fg-muted'), disabled: v('fg-disabled') },
  divider: v('border'),
};

export function muiThemeOptions() {
  return {
    cssVariables: { colorSchemeSelector: '[data-mode="%s"]', nativeColor: true },
    defaultColorScheme: 'dark' as const,
    colorSchemes: { dark: { palette }, light: { palette } },
    typography: { fontFamily: v('font-sans') },
  };
}
