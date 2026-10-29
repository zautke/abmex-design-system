import { useEffect, useId, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ElementType, FormEvent, ReactNode } from 'react';
import { Button, Text, useRoot, useComponentProps, resolveState, mergePartProps } from '../../primitives/foundation';
import type { PartAppearance, PrimitiveComponent, PrimitiveProps, PrimitiveState, RenderProps } from '../../primitives/foundation';
import { useControllableState, usePersistentState } from '../../hooks/usePersistentState';
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarItem, useSidebar } from '../sidebar';
import { ContentPane } from '../sidebar-demo/ContentPane';

export type RecipeSearchMode = 'semantic' | 'ingredients' | 'hybrid';
export interface RecipeSearchResult { id: string; title: string; description: string; ingredients: string[] }
export interface RecipeSearchRequest { query: string; mode: RecipeSearchMode; limit: number; signal: AbortSignal }
export type RecipeSearch = (request: RecipeSearchRequest) => Promise<RecipeSearchResult[]>;
export interface SidebarSearchFormState extends PrimitiveState { busy: boolean; query: string }
export interface SidebarSearchFormOwnProps extends PartAppearance<SidebarSearchFormState, 'root' | 'input' | 'submit' | 'label'> {
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  onSearch: (query: string) => void;
  busy?: boolean;
  label?: string;
  inputProps?: ComponentPropsWithRef<'input'>;
  submitLabel?: ReactNode;
}
export type SidebarSearchFormProps<C extends ElementType = 'form'> = PrimitiveProps<C, SidebarSearchFormOwnProps, SidebarSearchFormState>;

/** Independent search form; host owns retrieval. Enter and button share one submit path. */
export const SidebarSearchForm: PrimitiveComponent<'form', SidebarSearchFormOwnProps, SidebarSearchFormState> = (input: SidebarSearchFormProps) => {
  const { query, defaultQuery = '', onQueryChange, onSearch, busy = false,
    label = 'Search recipes', inputProps, submitLabel = 'Search', ...props } = useComponentProps('SidebarSearchForm', input);
  const [value, setValue] = useControllableState({ value: query, defaultValue: defaultQuery, onChange: onQueryChange });
  const id = useId();
  const state = { busy, query: value, unstyled: props.unstyled ?? false };
  const root = useRoot(props as RenderProps, state, 'form');
  const appearance = (part: 'label' | 'input' | 'submit', defaults: string) => ({
    className: `${state.unstyled ? '' : defaults} ${resolveState(props.classNames?.[part], state) ?? ''}`,
    style: resolveState(props.styles?.[part], state),
  });
  const onSubmit = root.props.onSubmit as ((event: FormEvent) => void) | undefined;
  return root.render({ ...root.props, onSubmit: (event: FormEvent) => {
    onSubmit?.(event); if (event.defaultPrevented) return; event.preventDefault();
    if (!busy && value.trim()) onSearch(value.trim());
  }, children: <>
    <label htmlFor={inputProps?.id ?? id} {...appearance('label', 'mb-2 block text-xs font-medium text-fg-muted')}>{label}</label>
    <input {...inputProps} id={inputProps?.id ?? id} value={value} disabled={busy || inputProps?.disabled}
      onChange={event => { inputProps?.onChange?.(event); if (!event.defaultPrevented) setValue(event.currentTarget.value); }}
      {...mergePartProps(appearance('input', 'w-full rounded-md border border-border bg-field px-3 py-2 text-sm text-fg focus-visible:outline-2 focus-visible:outline-focus'), { className: inputProps?.className, style: inputProps?.style })} />
    <Button type="submit" unstyled={state.unstyled} disabled={busy || !value.trim()} {...appearance('submit', 'mt-2 w-full')}>{busy ? 'Searching…' : submitLabel}</Button>
  </> });
};

const recipes: RecipeSearchResult[] = [
  { id: 'lemon-chickpeas', title: 'Lemon chickpea skillet', description: 'A bright, quick vegetarian supper.', ingredients: ['chickpeas', 'lemon', 'spinach', 'garlic'] },
  { id: 'tomato-pasta', title: 'Roasted tomato pasta', description: 'Warm comfort food with sweet roasted vegetables.', ingredients: ['tomato', 'pasta', 'basil', 'garlic'] },
  { id: 'miso-soup', title: 'Miso mushroom soup', description: 'A warming, light bowl for a quiet evening.', ingredients: ['miso', 'mushroom', 'tofu', 'spinach'] },
];

/** Explicit local fixture adapter. Topic tags stand in for semantic retrieval; no remote/model claims. */
export const searchRecipeFixtures: RecipeSearch = async ({ query, mode, limit, signal }) => {
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const words = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
  return recipes.filter(recipe => {
    const ingredientMatch = words.every(word => recipe.ingredients.some(ingredient => ingredient.includes(word)));
    const topicMatch = words.some(word => `${recipe.title} ${recipe.description}`.toLowerCase().includes(word));
    return mode === 'ingredients' ? ingredientMatch : mode === 'hybrid' ? ingredientMatch || topicMatch : topicMatch;
  }).slice(0, limit);
};

function CollapsibleSearch({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();
  return <div hidden={collapsed} inert={collapsed} className="border-b border-border p-4">{children}</div>;
}

export interface RecipeSearchSidebarDemoProps {
  search?: RecipeSearch;
  initialMode?: RecipeSearchMode;
  persistenceKey?: string;
  className?: string;
}

/** Donor-shaped search journey with replaceable retrieval and actual content destinations. */
export function RecipeSearchSidebarDemo({ search = searchRecipeFixtures, initialMode = 'semantic', persistenceKey, className = '' }: RecipeSearchSidebarDemoProps) {
  const [mode, setMode] = useState(initialMode);
  const [page, setPage] = useState('search');
  const [query, setQuery] = useState('tomato');
  const [results, setResults] = useState<RecipeSearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [limit, setLimit] = useState(10);
  const [theme, setTheme] = usePersistentState<'dark' | 'light'>({ initialValue: 'dark', key: persistenceKey ? `${persistenceKey}:theme` : undefined,
    validate: (value): value is 'dark' | 'light' => value === 'dark' || value === 'light' });
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function execute(nextQuery: string) {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError(''); setPage('search');
    try {
      const found = await search({ query: nextQuery, mode, limit, signal: controller.signal });
      if (!controller.signal.aborted) { setResults(found); setSearched(true); }
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Search failed. Try again.');
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }
  const modes = [['semantic', 'Semantic Search', '⌕'], ['ingredients', 'Ingredient Search', '♧'], ['hybrid', 'Hybrid Search', '✦']] as const;
  return <div data-theme={theme} className={`flex min-h-[34rem] overflow-hidden bg-bg text-fg ${className}`}>
    <Sidebar aria-label="Recipe search sidebar" collapseToIcons defaultWidth={320} minWidth={240} maxWidth={480}
      persistence={persistenceKey ? { key: `${persistenceKey}:sidebar` } : undefined}>
      <SidebarHeader><Text as="h2" className="font-semibold">Search</Text></SidebarHeader>
      <CollapsibleSearch><SidebarSearchForm query={query} onQueryChange={setQuery} onSearch={execute} busy={busy} inputProps={{ placeholder: 'Search recipes…' }} /></CollapsibleSearch>
      <SidebarContent><SidebarGroup>{modes.map(([value, label, icon]) => <SidebarItem key={value} label={label} icon={icon}
        active={page === 'search' && mode === value} onClick={() => { setMode(value); setPage('search'); }} />)}</SidebarGroup></SidebarContent>
      <SidebarFooter>
        <SidebarItem label={theme === 'dark' ? 'Dark Mode' : 'Light Mode'} icon={theme === 'dark' ? '☾' : '☼'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        {['Analytics', 'Documentation', 'Settings'].map(label => <SidebarItem key={label} label={label} icon={label === 'Analytics' ? '▥' : label === 'Settings' ? '⚙' : '▤'} active={page === label.toLowerCase()} onClick={() => setPage(label.toLowerCase())} />)}
      </SidebarFooter>
    </Sidebar>
    <ContentPane title={page === 'search' ? modes.find(([value]) => value === mode)![1] : page[0]!.toUpperCase() + page.slice(1)}
      eyebrow="Labsupapg → ABMEX" description="Local recipe fixtures. Replace the search adapter for your application’s retrieval service.">
      {page === 'search' && <section aria-label="Search results" aria-busy={busy}>
        <p role="status" className="mb-4 text-sm text-fg-muted">{busy ? 'Searching…' : searched ? `${results.length} recipes found` : 'Search tomato, spinach, or pasta to begin.'}</p>
        {error && <p role="alert">{error}</p>}
        <div className="grid gap-3">{results.map(recipe => <article key={recipe.id} className="rounded-lg border border-border bg-surface p-4">
          <h3 className="font-semibold text-fg-strong">{recipe.title}</h3><p className="my-2 text-sm">{recipe.description}</p><p className="text-xs text-fg-muted">{recipe.ingredients.join(' · ')}</p>
        </article>)}</div>
      </section>}
      {page === 'analytics' && <p role="status">Current result count: {results.length}. Search mode: {mode}. Result limit: {limit}.</p>}
      {page === 'documentation' && <div><h3 className="font-semibold">Connect your search service</h3><p className="mt-3">Pass a search adapter accepting query, mode, limit, and AbortSignal. Return recipe results. Sidebar navigation and theme remain independently configurable.</p></div>}
      {page === 'settings' && <label>Result limit <input aria-label="Result limit" type="number" min={1} max={100} value={limit} onChange={event => setLimit(Math.min(100, Math.max(1, Number(event.currentTarget.value) || 1)))} className="ml-3 rounded border border-border bg-field p-2" /></label>}
    </ContentPane>
  </div>;
}
