import { useState, useEffect, useMemo, useRef, type KeyboardEvent } from 'react';
import { SlidersHorizontal, RefreshCw, X, ChevronDown, Plus, Trash2, Pencil } from 'lucide-react';
import { Popover } from '@heroui/react';
import { ColorSystem } from './ColorSystem';
import {
  COLOR_FAMILIES,
  DEFAULT_LCH,
  type ColorFamily,
  type ColorLCH,
  type Theme,
} from '../../types/theme';
import {
  FAMILY_ROLE_DEFAULTS,
  formatOklch,
  isFamilyDefault,
  parseColorToLch,
  roleVar,
} from '../../utils/themePalette';
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
  /** Per-family OKLCH anchors (see `DEFAULT_LCH`). */
  colors: Record<ColorFamily, ColorLCH>;
  setColors: (next: Record<ColorFamily, ColorLCH>) => void;
  overrides: Record<string, string>;
  setOverrides: (next: Record<string, string>) => void;
  /** Set one family's anchor. Every role the family drives follows, in both twins. */
  handleFamilyChange: (family: ColorFamily, color: ColorLCH) => void;
  /** Restore the active theme to defaults in ONE write. When omitted, Reset All
   * falls back to `setColors(DEFAULT_LCH)` + `setOverrides({})`. */
  onResetAll?: () => void;
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
  handleFamilyChange,
  onResetAll,
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
  
  const createInputRef = useRef<HTMLInputElement>(null);

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
            
            {/* Theme Selector Dropdown — HeroUI Popover: portals own stacking
                and press-outside dismissal (no useOnClickOutside, no z-index). */}
            <div className="relative ml-2">
              <div className="flex items-center">
                <Popover
                  isOpen={isThemeDropdownOpen}
                  onOpenChange={(open) => {
                    setIsThemeDropdownOpen(open);
                    if (!open) {
                      // Closing abandons create/rename drafts, matching the old
                      // outside-click behavior.
                      setIsCreatingTheme(false);
                      setNewThemeName('');
                      setEditingThemeId(null);
                    }
                  }}
                >
                  <Popover.Trigger
                    aria-label={`Theme: ${activeTheme.name}`}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-ph-fg bg-ph-surface-2 hover:bg-ph-surface-3 rounded border border-ph-border transition-colors cursor-pointer"
                  >
                    <span className="truncate max-w-[100px]">{activeTheme.name}</span>
                    <ChevronDown size={12} className={`transition-transform ${isThemeDropdownOpen ? 'rotate-180' : ''}`} />
                  </Popover.Trigger>
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

                  <Popover.Content placement="bottom start" className="w-48 bg-ph-overlay border border-ph-border rounded-lg shadow-ph-overlay py-1">
                    <Popover.Dialog aria-label="Theme selector" className="p-0">
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
                    </Popover.Dialog>
                  </Popover.Content>
                </Popover>
              </div>
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
          onClick={() => { if (onResetAll) onResetAll(); else { setColors(DEFAULT_LCH); setOverrides({}); } }}
          className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-themeedit-reset-text hover:text-themeedit-reset-text-hover bg-ph-surface border border-themeedit-reset-border rounded-lg hover:bg-ph-surface-2 transition-colors w-full"
        >
          <RefreshCw size={14} />
          Reset All
        </button>
      </header>

      <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto pr-1 pb-4">
        {/* Palette families — the same row + the same full picker as every
            token below. A family is one OKLCH anchor; every Phosphor role it
            drives follows it, in both twins. */}
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold mb-1 text-ph-fg-strong">Palette</h2>
            <p className="text-xs text-ph-fg-muted leading-relaxed">
              Each family drives its Phosphor roles in both twins. Pick any color — lightness, chroma and hue all apply.
            </p>
          </div>
          <div className="flex flex-col gap-2" aria-label="Palette families">
            {COLOR_FAMILIES.map((family) => {
              const color = colors[family] ?? DEFAULT_LCH[family];
              const isSet = !isFamilyDefault(family, color);
              const roles = Object.keys(FAMILY_ROLE_DEFAULTS[family]).map(roleVar);
              return (
                <ColorRow
                  key={family}
                  name={family}
                  label={family}
                  subtitle={`drives ${roles.join(', ')}`}
                  value={isSet ? formatOklch(color) : ''}
                  placeholder={formatOklch(DEFAULT_LCH[family])}
                  pickerColor={formatOklch(color)}
                  swatch={formatOklch(color)}
                  isColor
                  isSet={isSet}
                  validate={(text) => parseColorToLch(text) !== null}
                  onChange={(text) => {
                    const lch = parseColorToLch(text);
                    if (lch) handleFamilyChange(family, lch);
                  }}
                  onClear={() => handleFamilyChange(family, DEFAULT_LCH[family])}
                  open={activeColorSystemVar === `family:${family}`}
                  onOpenChange={(open) => setActiveColorSystemVar(open ? `family:${family}` : null)}
                />
              );
            })}
          </div>
        </div>

        {/* Semantic Variables Section */}
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold mb-1 text-ph-fg-strong">Semantic Variables</h2>
            <p className="text-xs text-ph-fg-muted leading-relaxed">
              Override one token. An override beats its family in every twin.
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
                  {vars.map((v) => {
                    const family = ROLE_FAMILY[v.name];
                    return (
                      <ColorRow
                        key={v.name}
                        name={v.name}
                        label={v.name.replace('--color-', '')}
                        subtitle={family && !isFamilyDefault(family, colors[family] ?? DEFAULT_LCH[family]) ? `follows ${family} family` : v.defaultVal}
                        value={overrides[v.name] || ''}
                        placeholder={v.defaultVal}
                        // Seed the picker from the LIVE value (family edits
                        // included), not the stylesheet default.
                        pickerColor={overrides[v.name] || `var(${v.name})`}
                        swatch={overrides[v.name] || `var(${v.name})`}
                        isColor={v.isColor}
                        isSet={Boolean(overrides[v.name])}
                        onChange={(text) => handleOverrideChange(v.name, text)}
                        onClear={() => handleOverrideChange(v.name, '')}
                        open={activeColorSystemVar === v.name}
                        onOpenChange={(open) => setActiveColorSystemVar(open ? v.name : null)}
                      />
                    );
                  })}
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

/** Which family (if any) drives a Phosphor role. */
const ROLE_FAMILY: Record<string, ColorFamily> = Object.fromEntries(
  COLOR_FAMILIES.flatMap((f) => Object.keys(FAMILY_ROLE_DEFAULTS[f]).map((role) => [roleVar(role), f] as const)),
);

interface ColorRowProps {
  name: string;
  label: string;
  subtitle: string;
  /** Committed value ('' = not set). */
  value: string;
  placeholder: string;
  /** Any CSS color the picker can resolve (`var()` allowed). */
  pickerColor: string;
  swatch: string;
  isColor: boolean;
  isSet: boolean;
  /** Text is committed only when this accepts it; otherwise it stays a local draft. */
  validate?: (text: string) => boolean;
  onChange: (text: string) => void;
  onClear: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** One editable color: text field, swatch → full ColorSystem picker (HEX /
 * RGB / HSL / OKLCH), CLEAR. Palette families and tokens share it, so there is
 * exactly one way to pick a color in the editor. */
function ColorRow({ name, label, subtitle, value, placeholder, pickerColor, swatch, isColor, isSet, validate, onChange, onClear, open, onOpenChange }: ColorRowProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value;
  return (
    <div className="flex flex-col p-2.5 rounded-lg border border-ph-border bg-ph-surface-2 hover:border-ph-border-strong transition-colors gap-2" data-color-row={name}>
      <div className="flex flex-col overflow-hidden">
        <span className="text-xs font-mono text-ph-fg truncate" title={name}>{label}</span>
        <span className="text-xs text-ph-fg-muted font-mono truncate" title={subtitle}>{subtitle}</span>
      </div>
      <div className="flex items-center gap-2 justify-between">
        <input
          type="text"
          value={shown}
          onChange={(e) => {
            const text = e.target.value;
            if (!validate || text === '' || validate(text)) { setDraft(null); if (text === '' ) onClear(); else onChange(text); }
            else setDraft(text);
          }}
          onBlur={() => setDraft(null)}
          placeholder={placeholder}
          aria-label={`Override ${name}`}
          aria-invalid={draft !== null || undefined}
          className="flex-1 min-w-0 px-1.5 py-1 text-xs font-mono border border-ph-border-strong rounded focus:outline-none focus:border-ph-focus bg-ph-field text-ph-fg aria-[invalid]:border-ph-danger"
        />
        <div className="flex items-center gap-2 relative">
          {isColor && (
            <Popover isOpen={open} onOpenChange={onOpenChange}>
              {/* The Trigger IS the swatch (it renders its own role="button");
                  nesting a <button> inside it made two buttons per swatch. */}
              <Popover.Trigger
                className="w-5 h-5 rounded border border-ph-border-strong flex-shrink-0 cursor-pointer hover:border-ph-focus focus-visible:outline-2 focus-visible:outline-ph-focus transition-colors"
                style={{
                  backgroundColor: swatch,
                  backgroundImage: swatch.includes('transparent') ? 'repeating-conic-gradient(var(--ph-surface-3) 0 4px, transparent 0 8px)' : 'none',
                }}
                title="Click to open Color System"
                aria-label={`Pick color for ${name}`}
              />
              <Popover.Content placement="bottom end">
                <Popover.Dialog className="p-0" aria-label={`Color picker for ${name}`}>
                  <ColorSystem color={pickerColor.includes('var(') ? resolveColorValue(pickerColor) : pickerColor} onChange={onChange} />
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
          )}
          <button
            type="button"
            onClick={() => { setDraft(null); onClear(); }}
            className={`text-xs font-medium px-1.5 py-1 rounded text-ph-fg-muted hover:bg-ph-danger-soft hover:text-ph-danger-soft-fg transition-all ${isSet ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            CLEAR
          </button>
        </div>
      </div>
    </div>
  );
}
