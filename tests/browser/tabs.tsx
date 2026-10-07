import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Tabs } from '../../packages/ui/dist/components/tabs/index.js';

function Fixture() {
  const [visible, setVisible] = useState(true);
  const [disabled, setDisabled] = useState(false);
  return <>
    <button onClick={() => setVisible(!visible)}>Toggle first tab</button>
    <button onClick={() => setDisabled(!disabled)}>Toggle disabled</button>
    <Tabs defaultValue="a" style={{ '--tab-exit-duration': '5s' } as React.CSSProperties}>
      <Tabs.SheetList aria-label="Documents">
        {visible && <Tabs.Tab key="a" value="a" disabled={disabled}><Tabs.Tab.Label>Alpha</Tabs.Tab.Label></Tabs.Tab>}
        <Tabs.Tab key="b" value="b"><Tabs.Tab.Label>Beta</Tabs.Tab.Label></Tabs.Tab>
        <Tabs.Tab key="c" value="c"><Tabs.Tab.Label>Gamma</Tabs.Tab.Label></Tabs.Tab>
      </Tabs.SheetList>
      <Tabs.Panel value="a">Alpha content</Tabs.Panel>
      <Tabs.Panel value="b">Beta content</Tabs.Panel>
      <Tabs.Panel value="c">Gamma content</Tabs.Panel>
    </Tabs>
  </>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
