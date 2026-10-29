import type { SidebarPart } from './Sidebar';

/** Serializable discovery metadata; callbacks, custom renderers and refs use the exported TypeScript types. */
export const sidebarDescriptor = {
  name: 'Sidebar', exportPath: '@abmex/ui/sidebar', contractRevision: '0.9',
  parts: ['root', 'header', 'content', 'footer', 'group', 'groupLabel', 'item', 'itemBody', 'itemAction', 'interactiveContent', 'trigger', 'rail'] satisfies SidebarPart[],
  state: ['collapsed', 'width'],
  compositions: ['@abmex/ui/sidebar-search', '@abmex/ui/sidebar-demo'],
  styleChannels: ['className', 'style', 'classNames', 'styles', 'unstyled'],
} as const;

export const sidebarOptionsSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'ABMEX Sidebar serializable configuration', type: 'object', additionalProperties: false,
  properties: {
    side: { enum: ['left', 'right'] },
    collapsible: { type: 'boolean' }, collapseToIcons: { type: 'boolean' },
    showToggle: { type: 'boolean' }, showRail: { type: 'boolean' }, unstyled: { type: 'boolean' },
    minWidth: { type: 'number', minimum: 1 }, maxWidth: { type: 'number', minimum: 1 },
    collapsedWidth: { type: 'number', minimum: 1 }, defaultWidth: { type: 'number', minimum: 1 },
    defaultCollapsed: { type: 'boolean' },
  },
} as const;
