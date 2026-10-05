import { useEffect, useId, useRef, useState } from 'react';
import * as culori from 'culori';
import { HexColorPicker } from 'react-colorful';
import {
  formatChannelDisplay,
  normalizeChannelValue,
} from '../../internal/channelValue';

export interface ColorSystemProps {
  color: string; // The initial color (hex, rgb, oklch, etc)
  onChange: (color: string) => void; // Called when the color changes
}

type OklchColor = { mode?: 'oklch'; l: number; c: number; h?: number; alpha?: number };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

function toOklch(value: string): OklchColor {
  return culori.oklch(value) || culori.oklch('#000000')!;
}

/** `oklch(L% C H)` — rounded far below perceptual thresholds, stable for equality. */
function formatOklchCss(c: OklchColor): string {
  const l = Number((c.l * 100).toFixed(2));
  const ch = Number((c.c || 0).toFixed(4));
  const h = Number((((c.h ?? 0) % 360 + 360) % 360).toFixed(2));
  return `oklch(${l}% ${ch} ${h})`;
}

const CHANNEL_LABELS: Record<string, string> = {
  R: 'Red',
  G: 'Green',
  B: 'Blue',
  H: 'Hue',
  S: 'Saturation',
  L: 'Lightness',
  C: 'Chroma',
};

export function ColorSystem({ color: initialColor, onChange }: ColorSystemProps) {
  // State is held in OKLCH — the space the theme is authored in — and every
  // change is emitted as an `oklch(...)` string, so L/C/H moves survive the
  // round-trip exactly (emitting hex quantised them to 8-bit sRGB and the
  // prop echo then snapped the sliders back).
  const [internalColor, setInternalColor] = useState(() => toOklch(initialColor));
  const [hexInput, setHexInput] = useState(() => culori.formatHex(toOklch(initialColor)) || '#000000');
  // Outstanding echoes: strings this instance emitted that the parent has not
  // yet caught up with. A parent that persists asynchronously feeds them back
  // late and in order (h=54, h=108, … while the user is already at h=324);
  // re-applying one would snap the controls to a stale value. When the parent
  // reaches the LATEST emission it has caught up and the set is cleared, so a
  // later external value that happens to equal an old emission (Reset All to
  // a color picked earlier) is applied, not mistaken for an echo.
  const emitted = useRef<Set<string>>(new Set());
  const lastEmitted = useRef<string | null>(null);
  // Per-instance prefix so multiple ColorSystem mounts on the same page do
  // not collide on input id / name (Browser-1 a11y fix). useId is already
  // collision-free; we reuse it as the namespace for control `name`s too.
  const instanceId = useId();
  const hexInputId = `${instanceId}-hex`;

  // Derived views. culori.rgb returns 0–1 channels; the UI scales them.
  const rgb = culori.rgb(internalColor) || culori.rgb('#000000')!;
  const hsl = culori.hsl(internalColor) || culori.hsl('#000000')!;
  const hex = culori.formatHex(internalColor) || '#000000';

  useEffect(() => {
    if (initialColor === lastEmitted.current) {
      emitted.current.clear(); // caught up
      return;
    }
    if (emitted.current.has(initialColor)) return; // stale in-flight echo
    emitted.current.clear();
    lastEmitted.current = null;
    const c = culori.oklch(initialColor);
    if (c) {
      setInternalColor(c);
      setHexInput(culori.formatHex(c) || '#000000');
    }
  }, [initialColor]);

  const commit = (next: OklchColor, hexText?: string) => {
    const safe = { ...next, l: clamp(next.l, 0, 1), c: Math.max(0, next.c || 0), h: Number.isFinite(next.h) ? next.h : 0 };
    setInternalColor(safe);
    setHexInput(hexText ?? (culori.formatHex(safe) || '#000000'));
    const out = formatOklchCss(safe);
    emitted.current.add(out);
    lastEmitted.current = out;
    onChange(out);
  };

  const handleHexChange = (newHex: string) => {
    setHexInput(newHex);
    const parsed = culori.oklch(newHex);
    if (parsed) commit(parsed, newHex);
  };

  const handleColorPickerChange = (newHex: string) => {
    const parsed = culori.oklch(newHex);
    if (parsed) commit(parsed, newHex);
  };

  const handleChannelChange = (space: 'oklch' | 'rgb' | 'hsl', channel: string, value: number) => {
    let newColor: OklchColor | undefined;
    if (space === 'oklch') {
      newColor = { ...internalColor, [channel]: value };
    } else if (space === 'rgb') {
      newColor = culori.oklch({ ...rgb, mode: 'rgb', [channel]: value });
    } else {
      newColor = culori.oklch({ ...hsl, mode: 'hsl', [channel]: value });
    }
    if (newColor) commit(newColor);
  };

  return (
    <div className="flex flex-col gap-3 bg-ph-overlay p-3 rounded-xl shadow-ph-overlay border border-ph-border w-[320px] max-w-full" onClick={(e) => e.stopPropagation()}>
      <div className="flex gap-3 items-start">
        {/* React Colorful Picker — wrapped in a labeled group so the
            saturation/hue draggable surfaces have an accessible name. */}
        <div
          role="group"
          aria-label="Color picker"
          className="w-[100px] flex-shrink-0"
        >
          <HexColorPicker color={hex} onChange={handleColorPickerChange} style={{ width: '100%', height: '120px' }} />
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {/* Hex Input */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor={hexInputId}
              className="text-xs font-semibold text-ph-fg-muted w-8"
            >
              HEX
            </label>
            <input
              id={hexInputId}
              name={hexInputId}
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              aria-label="Hex color value"
              spellCheck={false}
              className="flex-1 px-1.5 py-1 text-xs font-mono border border-ph-border-strong rounded focus:outline-none focus:border-ph-focus bg-ph-field text-ph-fg"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            {/* RGB Channels */}
            <div className="flex flex-col gap-1">
              <div className="text-xs font-bold text-ph-fg uppercase tracking-wider mb-0.5">RGB</div>
              <ChannelSlider instanceId={instanceId} group="RGB" label="R" value={Math.round(rgb.r * 255)} min={0} max={255} onChange={(v) => handleChannelChange('rgb', 'r', v / 255)} />
              <ChannelSlider instanceId={instanceId} group="RGB" label="G" value={Math.round(rgb.g * 255)} min={0} max={255} onChange={(v) => handleChannelChange('rgb', 'g', v / 255)} />
              <ChannelSlider instanceId={instanceId} group="RGB" label="B" value={Math.round(rgb.b * 255)} min={0} max={255} onChange={(v) => handleChannelChange('rgb', 'b', v / 255)} />
            </div>

            {/* HSL Channels */}
            <div className="flex flex-col gap-1">
              <div className="text-xs font-bold text-ph-fg uppercase tracking-wider mb-0.5">HSL</div>
              <ChannelSlider instanceId={instanceId} group="HSL" label="H" value={Math.round(hsl.h || 0)} min={0} max={360} unit="deg" onChange={(v) => handleChannelChange('hsl', 'h', v)} />
              <ChannelSlider instanceId={instanceId} group="HSL" label="S" value={Math.round(hsl.s * 100)} min={0} max={100} unit="percent" onChange={(v) => handleChannelChange('hsl', 's', v / 100)} />
              <ChannelSlider instanceId={instanceId} group="HSL" label="L" value={Math.round(hsl.l * 100)} min={0} max={100} unit="percent" onChange={(v) => handleChannelChange('hsl', 'l', v / 100)} />
            </div>

            {/* OKLCH Channels */}
            <div className="flex flex-col gap-1">
              <div className="text-xs font-bold text-ph-fg uppercase tracking-wider mb-0.5">OKLCH</div>
              <ChannelSlider instanceId={instanceId} group="OKLCH" label="L" value={Math.round(internalColor.l * 100)} min={0} max={100} unit="percent" onChange={(v) => handleChannelChange('oklch', 'l', v / 100)} />
              <ChannelSlider instanceId={instanceId} group="OKLCH" label="C" value={internalColor.c} min={0} max={0.4} step={0.01} onChange={(v) => handleChannelChange('oklch', 'c', v)} />
              <ChannelSlider instanceId={instanceId} group="OKLCH" label="H" value={Math.round(internalColor.h || 0)} min={0} max={360} unit="deg" onChange={(v) => handleChannelChange('oklch', 'h', v)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type ChannelGroup = 'RGB' | 'HSL' | 'OKLCH';
type ChannelUnit = 'percent' | 'deg' | undefined;

function ChannelSlider({
  instanceId,
  group,
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  instanceId: string;
  group: ChannelGroup;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: ChannelUnit;
  onChange: (v: number) => void;
}) {
  // Guard non-finite, clamp to [min,max], normalize -0 before the range input.
  const safeValue = normalizeChannelValue(value, min, max);
  const displayValue = formatChannelDisplay(safeValue);
  // Long-form for screen readers. Includes group so HSL Hue + OKLCH Hue (and
  // HSL Lightness + OKLCH Lightness) read as distinct controls.
  const ariaLabel = `${group} ${CHANNEL_LABELS[label] ?? label}`;
  // Per-instance + per-channel stable name so multiple ColorSystem mounts on
  // the same page don't collide (Browser-1 completeness).
  const name = `${instanceId}-${group.toLowerCase()}-${label.toLowerCase()}`;
  // Units in the SR readout match the visual meaning.
  const valuetext =
    unit === 'percent'
      ? `${displayValue}%`
      : unit === 'deg'
        ? `${displayValue}°`
        : String(displayValue);
  const sliderId = useId();

  return (
    <div className="flex items-center gap-1.5">
      <label
        htmlFor={sliderId}
        className="text-xs font-medium text-ph-fg w-3"
        aria-hidden="true"
      >
        {label}
      </label>
      <input
        id={sliderId}
        name={name}
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
        aria-valuetext={valuetext}
        className="flex-1 h-1 bg-ph-surface-3 rounded-lg appearance-none cursor-pointer accent-ph-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ph-focus [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-ph-primary [&::-webkit-slider-thumb]:rounded-full"
      />
      <span className="text-xs text-ph-fg-muted w-7 text-right font-mono tabular-nums leading-none">{displayValue}</span>
    </div>
  );
}
