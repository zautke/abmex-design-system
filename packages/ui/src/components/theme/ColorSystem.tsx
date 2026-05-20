import { useEffect, useId, useState } from 'react';
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
  // We'll manage the internal state in OKLCH, converting back and forth
  // Initialize from the incoming string, fallback to black if unparseable
  const [internalColor, setInternalColor] = useState(() => culori.oklch(initialColor) || culori.oklch('#000000')!);
  const [hexInput, setHexInput] = useState(culori.formatHex(initialColor) || '#000000');
  // Per-instance prefix so multiple ColorSystem mounts on the same page do
  // not collide on input id / name (Browser-1 a11y fix). useId is already
  // collision-free; we reuse it as the namespace for control `name`s too.
  const instanceId = useId();
  const hexInputId = `${instanceId}-hex`;

  // Convert OKLCH to other spaces for the UI
  // Note: culori.rgb returns values from 0-1, so we'll scale for the UI
  const rgb = culori.rgb(internalColor) || culori.rgb('#000000')!;
  const hsl = culori.hsl(internalColor) || culori.hsl('#000000')!;
  const hex = culori.formatHex(internalColor) || '#000000';

  // Update when external color prop changes (if needed)
  useEffect(() => {
    const c = culori.oklch(initialColor);
    if (c) {
      setInternalColor(c);
      setHexInput(culori.formatHex(c) || '#000000');
    }
  }, [initialColor]);

  const handleHexChange = (newHex: string) => {
    setHexInput(newHex);
    const parsed = culori.oklch(newHex);
    if (parsed) {
      setInternalColor(parsed);
      onChange(culori.formatHex(parsed) || '#000000');
    }
  };

  const handleColorPickerChange = (newHex: string) => {
    setHexInput(newHex);
    const parsed = culori.oklch(newHex);
    if (parsed) {
      setInternalColor(parsed);
      onChange(culori.formatHex(parsed) || '#000000');
    }
  };

  const handleChannelChange = (space: 'oklch' | 'rgb' | 'hsl', channel: string, value: number) => {
    let newColor: any;

    if (space === 'oklch') {
      newColor = { ...internalColor, [channel]: value };
    } else if (space === 'rgb') {
      newColor = culori.oklch({ ...rgb, mode: 'rgb', [channel]: value });
    } else if (space === 'hsl') {
      newColor = culori.oklch({ ...hsl, mode: 'hsl', [channel]: value });
    }

    if (newColor) {
      setInternalColor(newColor);
      const newHex = culori.formatHex(newColor);
      if (newHex) {
        setHexInput(newHex);
        onChange(newHex);
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-white p-3 rounded-xl shadow-xl border border-slate-200 w-[320px] max-w-full" onClick={(e) => e.stopPropagation()}>
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
              className="text-[10px] font-semibold text-slate-500 w-8"
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
              className="flex-1 px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded focus:outline-none focus:border-teal-400 bg-slate-50"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            {/* RGB Channels */}
            <div className="flex flex-col gap-1">
              <div className="text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">RGB</div>
              <ChannelSlider instanceId={instanceId} group="RGB" label="R" value={Math.round(rgb.r * 255)} min={0} max={255} onChange={(v) => handleChannelChange('rgb', 'r', v / 255)} />
              <ChannelSlider instanceId={instanceId} group="RGB" label="G" value={Math.round(rgb.g * 255)} min={0} max={255} onChange={(v) => handleChannelChange('rgb', 'g', v / 255)} />
              <ChannelSlider instanceId={instanceId} group="RGB" label="B" value={Math.round(rgb.b * 255)} min={0} max={255} onChange={(v) => handleChannelChange('rgb', 'b', v / 255)} />
            </div>

            {/* HSL Channels */}
            <div className="flex flex-col gap-1">
              <div className="text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">HSL</div>
              <ChannelSlider instanceId={instanceId} group="HSL" label="H" value={Math.round(hsl.h || 0)} min={0} max={360} unit="deg" onChange={(v) => handleChannelChange('hsl', 'h', v)} />
              <ChannelSlider instanceId={instanceId} group="HSL" label="S" value={Math.round(hsl.s * 100)} min={0} max={100} unit="percent" onChange={(v) => handleChannelChange('hsl', 's', v / 100)} />
              <ChannelSlider instanceId={instanceId} group="HSL" label="L" value={Math.round(hsl.l * 100)} min={0} max={100} unit="percent" onChange={(v) => handleChannelChange('hsl', 'l', v / 100)} />
            </div>

            {/* OKLCH Channels */}
            <div className="flex flex-col gap-1">
              <div className="text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">OKLCH</div>
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
        className="text-[9px] font-medium text-slate-700 w-2.5"
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
        className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:rounded-full"
      />
      {/* Browser-2 fix: was text-slate-400 (~3.0:1 on white). Bumped to
          text-slate-600 (~5.5:1 on white) to clear WCAG AA at 9px. */}
      <span className="text-[9px] text-slate-600 w-6 text-right font-mono tabular-nums leading-none">{displayValue}</span>
    </div>
  );
}
