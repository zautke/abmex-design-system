import { useEffect, useState, useSyncExternalStore } from 'react';
import { createThemeController as createController, type ThemeState, type ThemeController, type ThemeControllerOptions } from '@abmex/themes';
export * from '@abmex/themes';

/** Compatibility entry: retain the existing UI controller's mode selector. */
export function createThemeController(options: ThemeControllerOptions = {}): ThemeController {
  const target = options.target ?? (typeof document === 'undefined' ? undefined : document.documentElement);
  const attribute = options.attribute ?? (target?.ownerDocument.defaultView?.getComputedStyle(target)
    .getPropertyValue('--theme-attribute').trim() || 'class');
  return createController({ ...options, attribute });
}

export interface UseThemeControllerResult extends ThemeState {
  setPreference: ThemeController['setPreference'];
  toggle: () => void;
  controller: ThemeController;
}

/** React binding for `createThemeController`. Options are read once, on first render. */
export function useThemeController(options?: ThemeControllerOptions): UseThemeControllerResult {
  const [controller] = useState(() => createThemeController({ ...options, defer: true }));
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getServerSnapshot);
  useEffect(() => {
    controller.mount();
    return () => controller.destroy();
  }, [controller]);
  return { ...state, setPreference: controller.setPreference, toggle: controller.toggle, controller };
}
