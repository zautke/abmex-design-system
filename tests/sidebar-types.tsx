import { createRef } from 'react';
import { Sidebar, SidebarHeader, SidebarItem, IconLabel } from '../packages/ui/dist/components/sidebar/index.js';
import { SidebarSearchForm } from '../packages/ui/dist/components/sidebar-search/index.js';

const anchor = createRef<HTMLAnchorElement>();
const label = createRef<HTMLLabelElement>();
const form = createRef<HTMLFormElement>();
const valid = <>
  <Sidebar as="a" href="/workspace" ref={anchor} />
  <SidebarHeader as="label" htmlFor="query" ref={label} />
  <SidebarItem href="/docs" ref={anchor} label="Documentation" />
  <IconLabel as="label" htmlFor="query" ref={label} label="Query" />
  <SidebarSearchForm ref={form} onSearch={() => {}} />
</>;
// @ts-expect-error Selected anchor target cannot receive a button ref.
const wrongRef = <Sidebar as="a" ref={createRef<HTMLButtonElement>()} />;
// @ts-expect-error Default navigation root has no href.
const wrongNative = <Sidebar href="/wrong" />;
void [valid, wrongRef, wrongNative];
