import type { ComponentDefaultOptions, ComponentPropMap, PrimitiveName } from './contract';
import { TEXT_DEFAULTS } from './Text';
import { ICON_DEFAULTS } from './Icon';
import { BUTTON_DEFAULTS } from './Button';
import { BASE_LAYOUT_DEFAULTS } from './BaseLayoutContainer';
import { LAYOUT_CONTAINER_DEFAULTS } from '../../components/layout/LayoutContainer';

type OptionDescriptor<T> = { [K in keyof T]?: { type: 'string' | 'boolean' | 'number'; values?: readonly Exclude<T[K], undefined>[] } };
type Descriptor<K extends PrimitiveName> = {
  name: K; exportPath: '@abmex/ui'; parts: readonly (keyof NonNullable<ComponentPropMap[K]['classNames']>)[];
  defaults: ComponentDefaultOptions[K]; options: OptionDescriptor<ComponentDefaultOptions[K]>;
  tokens: readonly string[]; stateful: false;
};
function descriptor<K extends PrimitiveName>(value: Descriptor<K>) {
  return { ...value, examples: ['packages/ui/demo/main.tsx'], tests: ['tests/components/primitives.test.tsx', 'packages/ui/type-tests/foundation.tsx'] };
}
const buttonOptions = { size: { type: 'string', values: ['sm', 'md', 'lg'] }, variant: { type: 'string', values: ['solid', 'outline', 'ghost'] } } as const;
const layoutOptions = { display: { type: 'string', values: ['block', 'flex', 'grid'] }, direction: { type: 'string', values: ['row', 'column'] } } as const;
export const primitiveDescriptors = [
  descriptor({ name: 'Text', exportPath: '@abmex/ui', parts: ['root'], defaults: TEXT_DEFAULTS, options: { tone: { type: 'string', values: ['inherit', 'muted', 'strong'] }, truncate: { type: 'boolean' } }, tokens: ['--fg-muted', '--fg-strong'], stateful: false }),
  descriptor({ name: 'Icon', exportPath: '@abmex/ui', parts: ['root'], defaults: ICON_DEFAULTS, options: { size: buttonOptions.size }, tokens: [], stateful: false }),
  descriptor({ name: 'Button', exportPath: '@abmex/ui', parts: ['root'], defaults: BUTTON_DEFAULTS, options: buttonOptions, tokens: ['--primary', '--primary-fg', '--fg', '--border', '--focus'], stateful: false }),
  descriptor({ name: 'IconButton', exportPath: '@abmex/ui', parts: ['root', 'icon'], defaults: BUTTON_DEFAULTS, options: buttonOptions, tokens: ['--primary', '--primary-fg', '--fg', '--border', '--focus'], stateful: false }),
  descriptor({ name: 'BaseLayoutContainer', exportPath: '@abmex/ui', parts: ['root'], defaults: BASE_LAYOUT_DEFAULTS, options: layoutOptions, tokens: [], stateful: false }),
  descriptor({ name: 'LayoutContainer', exportPath: '@abmex/ui', parts: ['root'], defaults: { ...BASE_LAYOUT_DEFAULTS, ...LAYOUT_CONTAINER_DEFAULTS }, options: layoutOptions, tokens: [], stateful: false }),
] as const;

/** Deliberately narrow projection: callbacks, refs, components and CSS values use TypeScript. */
export const primitiveConfigurationSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'ABMEX primitive serializable options',
  oneOf: primitiveDescriptors.map(item => ({
    type: 'object', additionalProperties: false, required: ['component'],
    properties: {
      component: { const: item.name }, unstyled: { type: 'boolean' },
      options: { type: 'object', additionalProperties: false, properties: Object.fromEntries(
        Object.entries(item.options).map(([key, value]) => [key, { type: value.type, ...('values' in value ? { enum: value.values } : {}) }]),
      ) },
    },
  })),
};
