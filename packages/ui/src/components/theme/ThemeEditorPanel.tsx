import { useState, useEffect, useRef, type KeyboardEvent, type RefObject } from 'react';
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

/**
 * Extract semantic (non-color-family) CSS custom properties from a stylesheet
 * string. A line counts as a semantic variable when it declares a
 * `--color-*` custom property whose name is NOT prefixed by a known color
 * family (`--color-{family}-…`). Exported for direct unit testing.
 */
export function parseSemanticVariables(css: string) {
  const vars: { name: string; defaultVal: string }[] = [];
  const lines = css.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*(--color-[a-zA-Z0-9-]+):\s*([^;]+);/);
    if (match) {
      const name = match[1]!;
      const defaultVal = match[2]!;
      if (!COLOR_FAMILIES.some((f) => name.startsWith(`--color-${f}-`))) {
        vars.push({ name, defaultVal });
      }
    }
  }
  return vars;
}

function resolveColorValue(value: string): string {
  if (typeof document === 'undefined' || !value) return value;
  
  let resolvedValue = value;
  let iterations = 0;
  // Resolve CSS variables up to 5 levels deep
  while (resolvedValue.includes('var(') && iterations < 5) {
    const match = resolvedValue.match(/var\(([^),]+)/);
    if (match) {
      const varName = match[1]!.trim();
      const computed = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      if (computed) {
        resolvedValue = resolvedValue.replace(/var\([^)]+\)/, computed);
      } else {
        break;
      }
    } else {
      break;
    }
    iterations++;
  }
  return resolvedValue || value;
}

export interface ThemeEditorPanelProps {
  onClose: () => void;
  /** Raw CSS source whose `--color-*` declarations seed the semantic-variable
   * list. Extension consumers pass `import cssText from '@merlyn/ui/styles.css?raw'`. */
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
  const [semanticVars, setSemanticVars] = useState<{ name: string; defaultVal: string }[]>([]);
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
    <div className="bg-app-bg text-slate-800 font-sans p-4 flex flex-col border-l border-slate-200 w-full sm:w-[350px] max-w-[350px] flex-shrink-0 h-full overflow-hidden">
      <header className="mb-4 flex flex-col gap-3 pb-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 relative">
            <SlidersHorizontal className="text-teal-600 flex-shrink-0" size={20} />
            <h1 className="text-lg font-semibold text-slate-800 flex-shrink-0">Theme Editor</h1>
            
            {/* Theme Selector Dropdown */}
            <div className="relative ml-2" ref={dropdownRef}>
              <div className="flex items-center">
                <button 
                  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                >
                  <span className="truncate max-w-[100px]">{activeTheme.name}</span>
                  <ChevronDown size={12} className={`transition-transform ${isThemeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    setIsThemeDropdownOpen(true);
                    setIsCreatingTheme(true);
                  }}
                  className="ml-1 p-1 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                  title="Create New Theme"
                >
                  <Plus size={14} />
                </button>
              </div>

              {isThemeDropdownOpen && (
                <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-[100]">
                  {isCreatingTheme && (
                    <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                      <input
                        ref={createInputRef}
                        type="text"
                        value={newThemeName}
                        onChange={(e) => setNewThemeName(e.target.value)}
                        onKeyDown={handleCreateThemeSubmit}
                        placeholder="Theme name..."
                        className="w-full text-xs px-2 py-1 border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <p className="text-[9px] text-slate-400 mt-1 ml-1">Press Enter to save</p>
                    </div>
                  )}
                  
                  <div className="max-h-48 overflow-y-auto">
                    {themes.map((theme) => (
                      <div 
                        key={theme.id}
                        className={`flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-50 cursor-pointer group ${activeTheme.id === theme.id ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'}`}
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
                            className="w-full text-xs px-1 py-0.5 border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 mr-2"
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
                                  className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded"
                                  title="Rename Theme"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTheme(theme.id);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"
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
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
        <button 
          onClick={() => { setColors(DEFAULT_HS); setOverrides({}); }}
          className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors w-full"
        >
          <RefreshCw size={14} />
          Reset All
        </button>
      </header>

      <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto pr-1 pb-4">
        {/* Raw Colors Section */}
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold mb-1 text-slate-800">Raw Palettes</h2>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Adjusting these will update all semantic variables that reference them.
            </p>
          </div>

          {COLOR_FAMILIES.map(family => (
            <div key={family} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2.5">
              <div className="text-xs font-bold uppercase text-slate-700 flex items-center gap-2">
                <div 
                  className="w-3.5 h-3.5 rounded-sm shadow-inner"
                  style={{ backgroundColor: `hsl(${colors[family].h} ${colors[family].s}% 50%)` }}
                />
                {family}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-slate-400 w-3">H</span>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={colors[family].h}
                  onChange={(e) => handleRawChange(family, 'h', Number(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <span className="text-[10px] text-slate-400 w-5 text-right font-mono">{colors[family].h}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-slate-400 w-3">S</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={colors[family].s}
                  onChange={(e) => handleRawChange(family, 's', Number(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <span className="text-[10px] text-slate-400 w-5 text-right font-mono">{colors[family].s}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Semantic Variables Section */}
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold mb-1 text-slate-800">Semantic Variables</h2>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Override individual component variables here.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {semanticVars.map(v => (
              <div key={v.name} className="flex flex-col p-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:border-teal-200 transition-colors group gap-2">
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[11px] font-mono text-slate-700 truncate" title={v.name}>{v.name.replace('--color-', '')}</span>
                  <span className="text-[9px] text-slate-400 font-mono truncate">{v.defaultVal}</span>
                </div>
                <div className="flex items-center gap-2 justify-between">
                  <input
                    type="text"
                    value={overrides[v.name] || ''}
                    onChange={(e) => handleOverrideChange(v.name, e.target.value)}
                    placeholder={v.defaultVal}
                    className="flex-1 px-1.5 py-1 text-[10px] font-mono border border-slate-200 rounded focus:outline-none focus:border-teal-400 bg-white"
                  />
                  <div className="flex items-center gap-2 relative">
                    <button 
                      onClick={() => setActiveColorSystemVar(activeColorSystemVar === v.name ? null : v.name)}
                      className="w-5 h-5 rounded border border-slate-300 flex-shrink-0 shadow-inner cursor-pointer hover:border-teal-500 transition-colors z-10"
                      style={{ 
                        backgroundColor: overrides[v.name] || `var(${v.name})`,
                        backgroundImage: (overrides[v.name] || v.defaultVal).includes('transparent') ? 'repeating-conic-gradient(#eee 0 4px, transparent 0 8px)' : 'none'
                      }}
                      title="Click to open Color System"
                      type="button"
                    />
                    
                    {/* Render Color System directly aligned with the button */}
                    {activeColorSystemVar === v.name && (
                      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        {/* Invisible overlay to close when clicking outside */}
                        <div 
                          className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]" 
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

                    <button 
                      onClick={() => handleOverrideChange(v.name, '')}
                      className={`text-[9px] font-medium px-1.5 py-1 rounded text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all ${overrides[v.name] ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    >
                      CLEAR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
