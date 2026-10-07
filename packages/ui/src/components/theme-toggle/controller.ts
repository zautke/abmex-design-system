import { useEffect, useState, useSyncExternalStore } from 'react';
import { createThemeController, type ThemeState, type ThemeController, type ThemeControllerOptions } from '@abmex/themes';
export * from '@abmex/themes';

export interface UseThemeControllerResult extends ThemeState {
  setPreference: ThemeController['setPreference'];
  toggle: () => void;
  controller: ThemeController;
}

/** React binding for `createThemeController`. Options are read once, on first render. */
export function useThemeController(options?: ThemeControllerOptions): UseThemeControllerResult {
  const [controller] = useState(() => createThemeController(options));
  const state = useSyncExternalStore(controller.subscribe, controller.getState);
  useEffect(() => () => controller.destroy(), [controller]);
  return { ...state, setPreference: controller.setPreference, toggle: controller.toggle, controller };
}
