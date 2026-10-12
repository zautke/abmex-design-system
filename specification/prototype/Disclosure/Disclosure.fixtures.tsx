// Render fixtures shared by checks (CF-25 hydration diff runs over every one).
// Each fixture is a full composition in a distinct initial state. Stories
// (CF-18, layer 7) will import these rather than redefine them.
import { Disclosure } from './Disclosure';

export const fixtures = {
  collapsed: () => (
    <Disclosure>
      <Disclosure.Heading>
        <Disclosure.Trigger>Details<Disclosure.Indicator /></Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content><Disclosure.Body>Body</Disclosure.Body></Disclosure.Content>
    </Disclosure>
  ),
  expanded: () => (
    <Disclosure defaultExpanded>
      <Disclosure.Heading>
        <Disclosure.Trigger>Details<Disclosure.Indicator /></Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content><Disclosure.Body>Body</Disclosure.Body></Disclosure.Content>
    </Disclosure>
  ),
  disabled: () => (
    <Disclosure isDisabled>
      <Disclosure.Heading>
        <Disclosure.Trigger>Details<Disclosure.Indicator /></Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content><Disclosure.Body>Body</Disclosure.Body></Disclosure.Content>
    </Disclosure>
  ),
} as const;
