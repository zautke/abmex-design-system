import { OrientationToggle, Panel, Rail, RailGroup, SheetList, Tab, TabsRoot } from './Tabs';
import { Switcher } from './Switcher';

/** Phosphor tab system — compound: Tabs.SheetList / Tabs.Rail / Tabs.Tab / Tabs.Panel / … */
export const Tabs = Object.assign(TabsRoot, {
  SheetList,
  Rail,
  RailGroup,
  Tab,
  Panel,
  OrientationToggle,
  Switcher,
});

export { middleTruncate } from './Tabs';
export type {
  TabsOrientation,
  TabsMotion,
  TabsDensity,
  TabsProps,
  TabsSheetListProps,
  TabsRailProps,
  TabsRailGroupProps,
  TabsTabProps,
  TabsTabLabelProps,
  TabsTabChipProps,
  TabsTabMetaProps,
  TabsTabCloseProps,
  TabsPanelProps,
  TabsOrientationToggleProps,
} from './Tabs';
export type { TabsSwitcherProps, SwitcherGroup, SwitcherItem } from './Switcher';
