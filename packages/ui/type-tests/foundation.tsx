import { createRef } from 'react';
import type { ReactElement, Ref } from 'react';
import type { LayoutContainerProps } from '@abmex/ui';
import { Text, Icon, Button, IconButton, BaseLayoutContainer, LayoutContainer } from '@abmex/ui';

<Text as="a" href="/docs" ref={createRef<HTMLAnchorElement>()} onClick={e => { e.currentTarget.href; }} />;
<Button ref={createRef<HTMLButtonElement>()} />;
<Button slotProps={{ root: { disabled: true } }} />;
// @ts-expect-error State callbacks cannot change the state they receive; set disabled on the component or static root props.
<Button slotProps={{ root: state => ({ disabled: state.disabled }) }} />;
const conflictingRootState = { disabled: true };
// @ts-expect-error State callback return values forbid state-defining keys even through variables.
<Button slotProps={{ root: () => conflictingRootState }} />;
<BaseLayoutContainer as="main" aria-label="Main" />;
<LayoutContainer region="custom" />;
const layoutProps: LayoutContainerProps<'main'> = { as: 'main', region: 'public-consumer' };
<LayoutContainer {...layoutProps} as="main" />;
<Icon label="Warning" />;
<IconButton label="Close" />;
// @ts-expect-error IconButton root callbacks share Button's authoritative disabled state.
<IconButton label="Close" slotProps={{ root: state => ({ 'aria-disabled': state.disabled }) }} />;
function AppLink(props: { to: string; ref?: Ref<HTMLAnchorElement> }): ReactElement { return <a href={props.to} ref={props.ref} />; }
<Text as={AppLink} to="/docs" />;
// @ts-expect-error Native target props inferred; default span does not accept href.
<Text href="/docs" />;
// @ts-expect-error Anchor requires an anchor ref.
<Text as="a" ref={createRef<HTMLButtonElement>()} />;
// @ts-expect-error Required custom-component props remain required.
<Text as={AppLink} />;
// @ts-expect-error Icon-only control requires a name.
<IconButton />;
// @ts-expect-error State/options remain capability-specific.
<Button options={{ imaginary: true }} />;
// @ts-expect-error Root configuration is target-specific.
<Text slotProps={{ root: { href: '/docs' } }} />;
// @ts-expect-error Unknown slot names are rejected.
<IconButton label="Close" slots={{ unknown: AppLink }} />;
// @ts-expect-error Required unrelated root props cannot be silently omitted.
<Text slots={{ root: AppLink }} />;
