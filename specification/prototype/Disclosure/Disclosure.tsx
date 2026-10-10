// Layer 1 — structure + data-slot (CF-01, CF-02, CF-04, CF-05, CF-27, CF-32).
//
// The abmex Disclosure is a compound: six parts exposed by dot notation, each
// rendering one DOM element that carries `data-slot="<component>-<part>"`. The
// engine is HeroUI v3's Disclosure (itself a thin wrapper over
// react-aria-components/Disclosure), which already emits exactly the six
// `data-slot` values the manifest declares, so layer 1 adds no DOM of its own:
// it fixes the public shape (dot-notation only, no flat part exports) and pins
// the anatomy to the manifest. Ids for the aria-controls/aria-labelledby pair
// come from React Aria's useId — nothing here generates an id (CF-25
// constraint). No provider is required to render (CF-27).
//
// Later layers add, in order: orphan-part errors + context (2), controlled
// state with change details (3), the `render` prop + refs (4), the styling
// surface (5), motion (6). Nothing in this file should be read as the final
// Disclosure API — see SPEC.md § Layer 1.
import { Disclosure as Engine } from '@heroui/react';
import type { ComponentProps } from 'react';

type RootProps = ComponentProps<typeof Engine.Root>;
type HeadingProps = ComponentProps<typeof Engine.Heading>;
type TriggerProps = ComponentProps<typeof Engine.Trigger>;
type ContentProps = ComponentProps<typeof Engine.Content>;
type BodyProps = ComponentProps<typeof Engine.Body>;
type IndicatorProps = ComponentProps<typeof Engine.Indicator>;

function Root(props: RootProps) {
  return <Engine.Root {...props} />;
}
function Heading(props: HeadingProps) {
  return <Engine.Heading {...props} />;
}
function Trigger(props: TriggerProps) {
  return <Engine.Trigger {...props} />;
}
function Content(props: ContentProps) {
  return <Engine.Content {...props} />;
}
function Body(props: BodyProps) {
  return <Engine.Body {...props} />;
}
function Indicator(props: IndicatorProps) {
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
