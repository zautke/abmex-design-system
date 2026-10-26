import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Text, Icon, Button, IconButton, BaseLayoutContainer, LayoutContainer, ComponentDefaultsProvider } from '@abmex/ui';
import '@abmex/ui/styles.css';

function Demo() {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const [count, setCount] = useState(0);
  const [page, setPage] = useState('Overview');
  return <BaseLayoutContainer as="main" data-mode={mode} options={{ display: 'flex', direction: 'column', gap: 24 }}
    style={{ minHeight: '100vh', padding: 32, background: 'var(--bg)', color: 'var(--fg)' }}>
    <Text as="h1" options={{ tone: 'strong' }} style={{ fontSize: 28 }}>ABMEX primitive exercise</Text>
    <Button onAction={() => setMode(mode === 'dark' ? 'light' : 'dark')}>Switch to {mode === 'dark' ? 'light' : 'dark'}</Button>
    <LayoutContainer as="section" region="toolbar" aria-label="Document toolbar" options={{ display: 'flex', gap: 12 }} style={{ padding: 16, border: '1px solid var(--border)' }}>
      <Icon label="Document"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 3h9l3 3v15H6zM9 10h6M9 14h6" /></svg></Icon>
      <Text>Draft document</Text>
      <Button onAction={() => setCount(value => value + 1)}>Save</Button>
      <IconButton label="Reset saves" onAction={() => setCount(0)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 8h12a6 6 0 0 1 0 12M4 8l5-5M4 8l5 5" /></svg></IconButton>
      <Text aria-live="polite">Saved {count} times</Text>
      <Button disabled>Unavailable</Button>
      <ComponentDefaultsProvider defaults={{ Button: { slotProps: { root: { disabled: true } } } }}>
        <Button slotProps={{ root: { title: 'Merged disabled default' } }} onAction={() => setCount(value => value + 100)}>
          {state => state.disabled ? 'Scoped unavailable' : 'Unexpectedly enabled'}
        </Button>
      </ComponentDefaultsProvider>
    </LayoutContainer>
    <ComponentDefaultsProvider defaults={{ Button: { options: { variant: 'outline', size: 'sm' } } }}>
      <BaseLayoutContainer as="section" aria-label="Navigation composition" options={{ display: 'grid', gap: 16 }} style={{ gridTemplateColumns: '180px 1fr' }}>
        <BaseLayoutContainer as="nav" aria-label="Sections" options={{ display: 'flex', direction: 'column', gap: 8 }}>
          {['Overview', 'Details'].map(name => <Button key={name} aria-current={page === name ? 'page' : undefined} onAction={() => setPage(name)}>{name}</Button>)}
        </BaseLayoutContainer>
        <LayoutContainer as="article" region="content" aria-label="Content pane" style={{ padding: 16, background: 'var(--surface)' }}>
          <Text as="h2" options={{ tone: 'strong' }}>{page}</Text>
          <Text as="p">Shared primitives in a second composition.</Text>
          <Button as="div" onAction={() => setCount(value => value + 1)}>Keyboard action</Button>
          <Button as="a" href="#root" options={{ variant: 'ghost' }}>Back to top</Button>
        </LayoutContainer>
      </BaseLayoutContainer>
    </ComponentDefaultsProvider>
  </BaseLayoutContainer>;
}
createRoot(document.getElementById('root')!).render(<Demo />);
