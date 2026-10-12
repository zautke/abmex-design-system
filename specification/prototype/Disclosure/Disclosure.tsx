// Layer 2 — context + orphan-part errors (CF-15) on top of layer 1 structure.
//
// The abmex Disclosure is a compound: six parts exposed by dot notation, each
// rendering one DOM element that carries `data-slot="<component>-<part>"`. The
// engine is HeroUI v3's Disclosure (RAC Disclosure underneath), which already
// emits the six `data-slot` values and the aria-controls/aria-expanded pair via
// `useId` (CF-25: nothing here authors an id). No provider is required (CF-27).
//
// Layer 2 adds the component's OWN context: Root publishes it, every other part
// reads it and throws `OrphanPartError` (code `ABMEX_ORPHAN_PART`) when it is
// absent. The engine's own context is not reused for this because its failure
// mode (silent or cryptic) is exactly what CF-15 forbids. Parts stay
// individually removable and render in JSX order — the context carries no
// layout, only presence.
//
// Later layers add, in order: controlled state with change details (3), the
// `render` prop + refs (4), the styling surface (5), motion (6).
import { Disclosure as Engine } from '@heroui/react';
import { createContext, useContext, type ComponentProps } from 'react';
import { OrphanPartError } from '../errors';

const COMPONENT = 'Disclosure';
const DisclosureContext = createContext(false);

/** Throws CF-15's named error when `part` renders outside `<Disclosure>`. */
function usePart(part: string) {
  if (!useContext(DisclosureContext)) throw new OrphanPartError(COMPONENT, part);
}

type RootProps = ComponentProps<typeof Engine.Root>;
type HeadingProps = ComponentProps<typeof Engine.Heading>;
type TriggerProps = ComponentProps<typeof Engine.Trigger>;
type ContentProps = ComponentProps<typeof Engine.Content>;
type BodyProps = ComponentProps<typeof Engine.Body>;
type IndicatorProps = ComponentProps<typeof Engine.Indicator>;

function Root(props: RootProps) {
  return (
    <DisclosureContext.Provider value={true}>
      <Engine.Root {...props} />
    </DisclosureContext.Provider>
  );
}
function Heading(props: HeadingProps) {
  usePart('Heading');
  return <Engine.Heading {...props} />;
}
function Trigger(props: TriggerProps) {
  usePart('Trigger');
  return <Engine.Trigger {...props} />;
}
function Content(props: ContentProps) {
  usePart('Content');
  return <Engine.Content {...props} />;
}
function Body(props: BodyProps) {
  usePart('Body');
  return <Engine.Body {...props} />;
}
function Indicator(props: IndicatorProps) {
  usePart('Indicator');
  return <Engine.Indicator {...props} />;
}

/** `Disclosure.Root` … `Disclosure.Indicator` — the only public surface (CF-05). */
export const Disclosure = Object.assign(Root, {
  Heading,
  Trigger,
  Content,
  Body,
  Indicator,
});

export type {
  RootProps as DisclosureRootProps,
  HeadingProps as DisclosureHeadingProps,
  TriggerProps as DisclosureTriggerProps,
  ContentProps as DisclosureContentProps,
  BodyProps as DisclosureBodyProps,
  IndicatorProps as DisclosureIndicatorProps,
};
