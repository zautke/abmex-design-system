import { useState, useEffect, useMemo, useRef, type KeyboardEvent, type RefObject } from 'react';
import { SlidersHorizontal, RefreshCw, X, ChevronDown, Plus, Trash2, Pencil } from 'lucide-react';
import { ColorSystem } from './ColorSystem';
import { useOnClickOutside } from 'usehooks-ts';
import {
  COLOR_FAMILIES,
  DEFAULT_HS,
  type ColorFamily,
  type ColorHS,
  type Theme,
} from '../../types/theme';
import { parseSemanticVariables, type SemanticVariable } from '../../internal/parseSemanticVariables';

const GROUP_LABELS: Record<string, string> = { heroui: 'HeroUI bridge', md: 'Markdown', conn: 'Connection', oocm: 'Out-of-context message', phosphor: 'Phosphor' };

function groupLabel(group: string): string {
  return GROUP_LABELS[group] ?? group.charAt(0).toUpperCase() + group.slice(1);
}

/** Resolve a token's default (a `var()` chain, `color-mix()`, a fallback such as
 * `var(--color-eclipse, oklch(...))`) to a concrete color by letting the CSS
 * engine compute it on a probe element. Anything it cannot compute (or a
 * non-browser environment) returns the raw value for the picker to reject. */
function resolveColorValue(value: string): string {
  if (typeof document === 'undefined' || !value) return value;
  const probe = document.createElement('span');
  probe.style.color = value;
  if (!probe.style.color) return value;
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  document.documentElement.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved || value;
}

export interface ThemeEditorPanelProps {
  onClose: () => void;
  /** Raw CSS source whose `--color-*` declarations seed the semantic-variable
   * list. Extension consumers pass `import cssText from '@abmex/ui/styles.css?raw'`. */
  cssText: string;
  colors: Record<ColorFamily, ColorHS>;
  setColors: (next: Record<ColorFamily, ColorHS>) => void;
  overrides: Record<string, string>;
  setOverrides: (next: Record<string, string>) => void;
  handleRawChange: (family: ColorFamily, channel: 'h' | 's', value: number) => void;
  handleOverrideChange: (name: string, value: string) => void;
  themes: Theme[];
  activeTheme: Theme;
  setActiveThemeId: (id: string) => void;
  saveNewTheme: (name: string) => void;
  deleteTheme: (id: string) => void;
  renameTheme: (id: string, name: string) => void;
}

export function ThemeEditorPanel({
  onClose,
  cssText,
  colors,
  setColors,
  setOverrides,
  overrides,
  handleRawChange,
  handleOverrideChange,
  themes,
  activeTheme,
  setActiveThemeId,
  saveNewTheme,
  deleteTheme,
  renameTheme,
}: ThemeEditorPanelProps) {
  const [semanticVars, setSemanticVars] = useState<SemanticVariable[]>([]);
  const [filter, setFilter] = useState('');
  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const map = new Map<string, SemanticVariable[]>();
    for (const v of semanticVars) {
      if (q && !v.name.toLowerCase().includes(q)) continue;
      (map.get(v.group) ?? map.set(v.group, []).get(v.group)!).push(v);
    }
    // Phosphor roles first: they are what the kit actually reads.
    return [...map.entries()].sort(([a], [b]) => Number(b === 'phosphor') - Number(a === 'phosphor'));
  }, [semanticVars, filter]);
  const [activeColorSystemVar, setActiveColorSystemVar] = useState<string | null>(null);
  
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isCreatingTheme, setIsCreatingTheme] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editThemeName, setEditThemeName] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  useOnClickOutside(dropdownRef as unknown as RefObject<HTMLElement>, () => {
    setIsThemeDropdownOpen(false);
    setIsCreatingTheme(false);
    setNewThemeName('');
    setEditingThemeId(null);
  });

  useEffect(() => {
    setSemanticVars(parseSemanticVariables(cssText));
  }, [cssText]);

  useEffect(() => {
    if (isCreatingTheme && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [isCreatingTheme]);

  const handleCreateThemeSubmit = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newThemeName.trim()) {
      saveNewTheme(newThemeName.trim());
      setIsCreatingTheme(false);
      setNewThemeName('');
      setIsThemeDropdownOpen(false);
    } else if (e.key === 'Escape') {
      setIsCreatingTheme(false);
      setNewThemeName('');
    }
  };

  const handleEditThemeSubmit = (e: KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter' && editThemeName.trim()) {
      renameTheme(id, editThemeName.trim());
      setEditingThemeId(null);
      setEditThemeName('');
    } else if (e.key === 'Escape') {
      setEditingThemeId(null);
      setEditThemeName('');
    }
  };

  return (
    <div className="bg-themeedit-bg text-ph-fg-strong font-sans p-4 flex flex-col border-l border-themeedit-border w-full sm:w-[350px] max-w-[350px] flex-shrink-0 h-full overflow-hidden">
      <header className="mb-4 flex flex-col gap-3 pb-4 border-b border-themeedit-title-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 relative">
            <SlidersHorizontal className="text-ph-primary-soft-fg flex-shrink-0" size={20} />
            <h1 className="text-lg font-semibold text-themeedit-title-text flex-shrink-0">Theme Editor</h1>
            
            {/* Theme Selector Dropdown */}
            <div className="relative ml-2" ref={dropdownRef}>
              <div className="flex items-center">
                <button 
                  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-ph-fg bg-ph-surface-2 hover:bg-ph-surface-3 rounded border border-ph-border transition-colors"
                >
                  <span className="truncate max-w-[100px]">{activeTheme.name}</span>
                  <ChevronDown size={12} className={`transition-transform ${isThemeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    setIsThemeDropdownOpen(true);
                    setIsCreatingTheme(true);
                  }}
                  className="ml-1 p-1 text-ph-fg-muted hover:text-ph-primary-soft-fg hover:bg-ph-primary-soft rounded transition-colors"
                  title="Create New Theme"
                >
                  <Plus size={14} />
                </button>
              </div>

              {isThemeDropdownOpen && (
                <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1 w-48 bg-ph-overlay border border-ph-border rounded-lg shadow-ph-overlay py-1 z-[100]">
                  {isCreatingTheme && (
                    <div className="px-2 py-1.5 border-b border-ph-border mb-1">
                      <input
                        ref={createInputRef}
                        type="text"
                        value={newThemeName}
                        onChange={(e) => setNewThemeName(e.target.value)}
                        onKeyDown={handleCreateThemeSubmit}
                        placeholder="Theme name..."
                        className="w-full text-xs px-2 py-1 bg-ph-field text-ph-fg border border-ph-border-strong rounded focus:outline-none focus:border-ph-focus"
                      />
                      <p className="text-xs text-ph-fg-muted mt-1 ml-1">Press Enter to save</p>
                    </div>
                  )}
                  
                  <div className="max-h-48 overflow-y-auto">
                    {themes.map((theme) => (
                      <div 
                        key={theme.id}
                        className={`flex items-center justify-between px-3 py-1.5 text-xs hover:bg-ph-surface-2 cursor-pointer group ${activeTheme.id === theme.id ? 'bg-ph-primary-soft text-ph-primary-soft-fg font-medium' : 'text-ph-fg'}`}
                        onClick={() => {
                          if (editingThemeId !== theme.id) {
                            setActiveThemeId(theme.id);
                            setIsThemeDropdownOpen(false);
                          }
                        }}
                      >
                        {editingThemeId === theme.id ? (
                          <input
                            type="text"
                            value={editThemeName}
                            onChange={(e) => setEditThemeName(e.target.value)}
                            onKeyDown={(e) => handleEditThemeSubmit(e, theme.id)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-xs px-1 py-0.5 bg-ph-field text-ph-fg border border-ph-border-strong rounded focus:outline-none focus:border-ph-focus mr-2"
                          />
                        ) : (
                          <>
                            <span className="truncate pr-2">{theme.name}</span>
                            {!theme.isDefault && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingThemeId(theme.id);
                                    setEditThemeName(theme.name);
                                  }}
                                  className="p-1 text-ph-fg-muted hover:text-ph-primary-soft-fg hover:bg-ph-primary-soft rounded"
                                  title="Rename Theme"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTheme(theme.id);
                                  }}
                                  className="p-1 text-ph-fg-muted hover:text-ph-danger-soft-fg hover:bg-ph-danger-soft rounded"
                                  title="Delete Theme"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-ph-fg-muted hover:text-ph-fg-strong hover:bg-ph-surface-2 rounded-lg transition-colors flex-shrink-0"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
        <button 
          onClick={() => { setColors(DEFAULT_HS); setOverrides({}); }}
          className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-themeedit-reset-text hover:text-themeedit-reset-text-hover bg-ph-surface border border-themeedit-reset-border rounded-lg hover:bg-ph-surface-2 transition-colors w-full"
        >
          <RefreshCw size={14} />
          Reset All
        </button>
      </header>

      <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto pr-1 pb-4">
        {/* Raw Colors Section */}
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold mb-1 text-ph-fg-strong">Raw Palettes</h2>
            <p className="text-xs text-ph-fg-muted leading-relaxed">
              Adjusting these will update all semantic variables that reference them.
            </p>
          </div>

          {COLOR_FAMILIES.map(family => (
            <div key={family} className="bg-ph-surface p-3 rounded-xl border border-ph-border flex flex-col gap-2.5">
              <div className="text-xs font-bold uppercase text-themeedit-family-label flex items-center gap-2">
                <div 
                  className="w-3.5 h-3.5 rounded-sm"
                  style={{ backgroundColor: `hsl(${colors[family].h} ${colors[family].s}% 50%)` }}
                />
                {family}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-themeedit-slider-label w-3">H</span>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={colors[family].h}
                  onChange={(e) => handleRawChange(family, 'h', Number(e.target.value))}
                  className="flex-1 h-1.5 bg-themeedit-slider-track rounded-lg appearance-none cursor-pointer accent-themeedit-slider-thumb"
                />
                <span className="text-xs text-ph-fg-muted w-7 text-right font-mono">{colors[family].h}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-themeedit-slider-label w-3">S</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={colors[family].s}
                  onChange={(e) => handleRawChange(family, 's', Number(e.target.value))}
                  className="flex-1 h-1.5 bg-themeedit-slider-track rounded-lg appearance-none cursor-pointer accent-themeedit-slider-thumb"
                />
                <span className="text-xs text-ph-fg-muted w-7 text-right font-mono">{colors[family].s}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Semantic Variables Section */}
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold mb-1 text-ph-fg-strong">Semantic Variables</h2>
            <p className="text-xs text-ph-fg-muted leading-relaxed">
              Override individual component variables here.
            </p>
          </div>

          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter variables…"
            aria-label="Filter variables"
            className="w-full px-2 py-1.5 text-xs font-mono border border-ph-border-strong rounded-lg bg-ph-field text-ph-fg focus:outline-none focus:border-ph-focus"
          />

          <div className="flex flex-col gap-2" aria-label="Semantic variable groups">
            {groups.map(([group, vars]) => (
              <details key={group} open={filter.trim().length > 0 || undefined} className="rounded-lg border border-ph-border bg-ph-surface">
                <summary className="flex cursor-pointer items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-ph-fg select-none">
                  <span>{groupLabel(group)}</span>
                  <span className="text-xs font-mono text-ph-fg-muted">
                    {vars.filter((v) => overrides[v.name]).length > 0 && (
                      <span className="mr-1.5 text-ph-primary-soft-fg">{vars.filter((v) => overrides[v.name]).length} set</span>
                    )}
                    {vars.length}
                  </span>
                </summary>
                <div className="flex flex-col gap-2 p-2 pt-0">
                  {vars.map(v => (
                    <div key={v.name} className="flex flex-col p-2.5 rounded-lg border border-ph-border bg-ph-surface-2 hover:border-ph-border-strong transition-colors group gap-2">
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-mono text-ph-fg truncate" title={v.name}>{v.name.replace('--color-', '')}</span>
                      <span className="text-xs text-ph-fg-muted font-mono truncate">{v.defaultVal}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-between">
                      <input
                        type="text"
                        value={overrides[v.name] || ''}
                        onChange={(e) => handleOverrideChange(v.name, e.target.value)}
                        placeholder={v.defaultVal}
                        aria-label={`Override ${v.name}`}
                        className="flex-1 px-1.5 py-1 text-xs font-mono border border-ph-border-strong rounded focus:outline-none focus:border-ph-focus bg-ph-field text-ph-fg"
                      />
                      <div className="flex items-center gap-2 relative">
                        {v.isColor && (<>
                          <button 
                            onClick={() => setActiveColorSystemVar(activeColorSystemVar === v.name ? null : v.name)}
                            className="w-5 h-5 rounded border border-ph-border-strong flex-shrink-0 cursor-pointer hover:border-ph-focus transition-colors z-10"
                            style={{ 
                              backgroundColor: overrides[v.name] || `var(${v.name})`,
                              backgroundImage: (overrides[v.name] || v.defaultVal).includes('transparent') ? 'repeating-conic-gradient(var(--ph-surface-3) 0 4px, transparent 0 8px)' : 'none'
                            }}
                            title="Click to open Color System"
                            type="button"
                          />
                          
                          {/* Render Color System directly aligned with the button */}
                          {activeColorSystemVar === v.name && (
                            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                              {/* Invisible overlay to close when clicking outside */}
                              <div 
                                className="absolute inset-0 bg-ph-backdrop" 
                                onClick={() => setActiveColorSystemVar(null)}
                              />
                              <div className="relative z-10">
                                <ColorSystem 
                                  color={resolveColorValue(overrides[v.name] || v.defaultVal)}
                                  onChange={(newColor) => handleOverrideChange(v.name, newColor)}
                                />
                              </div>
                            </div>
                          )}
      
                        </>)}

                        <button 
                          onClick={() => handleOverrideChange(v.name, '')}
                          className={`text-xs font-medium px-1.5 py-1 rounded text-ph-fg-muted hover:bg-ph-danger-soft hover:text-ph-danger-soft-fg transition-all ${overrides[v.name] ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        >
                          CLEAR
                        </button>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              </details>
            ))}
            {groups.length === 0 && <p className="text-xs text-ph-fg-muted px-1">No variables match "{filter}".</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
