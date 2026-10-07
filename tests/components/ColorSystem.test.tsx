// @vitest-environment jsdom
// Contract tests for ColorSystem — targets the multi-mount naming +
// channel-value normalization flagged by the batch-4/5 council review (codex).

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { ColorSystem } from '@abmex/ui';
// Package-internal helpers — imported from source, not the public surface.
import {
  formatChannelDisplay,
  normalizeChannelValue,
} from '@/packages/ui/src/internal/channelValue';

afterEach(cleanup);

function rangeNames(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('input[type="range"]')).map(
    (el) => (el as HTMLInputElement).name,
  );
}

describe('ColorSystem — multi-mount control naming', () => {
  it('two mounts produce disjoint slider name sets (no collision)', () => {
    const a = render(<ColorSystem color="#3366cc" onChange={() => {}} />);
    const b = render(<ColorSystem color="#3366cc" onChange={() => {}} />);

    const namesA = rangeNames(a.container);
    const namesB = rangeNames(b.container);

    // 9 sliders each (RGB + HSL + OKLCH × 3).
    expect(namesA).toHaveLength(9);
    expect(namesB).toHaveLength(9);
    // Every name unique within a mount.
    expect(new Set(namesA).size).toBe(9);
    // Zero overlap across mounts.
    const overlap = namesA.filter((n) => namesB.includes(n));
    expect(overlap).toEqual([]);
  });

  it('hex inputs across two mounts have distinct id + name', () => {
    const a = render(<ColorSystem color="#3366cc" onChange={() => {}} />);
    const b = render(<ColorSystem color="#3366cc" onChange={() => {}} />);
    const hexA = a.container.querySelector('input[type="text"]') as HTMLInputElement;
    const hexB = b.container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(hexA.id).not.toBe(hexB.id);
    expect(hexA.name).not.toBe(hexB.name);
    expect(hexA.id).toBe(hexA.name);
  });

  it('slider name encodes group + channel', () => {
    const { container } = render(<ColorSystem color="#3366cc" onChange={() => {}} />);
    const names = rangeNames(container);
    // Suffix pattern: ...-rgb-r, ...-hsl-h, ...-oklch-l etc.
    expect(names.some((n) => n.endsWith('-rgb-r'))).toBe(true);
    expect(names.some((n) => n.endsWith('-hsl-h'))).toBe(true);
    expect(names.some((n) => n.endsWith('-oklch-l'))).toBe(true);
  });
});

describe('ColorSystem — a11y', () => {
  it('every slider has a group-scoped aria-label (HSL Hue ≠ OKLCH Hue)', () => {
    const { container } = render(<ColorSystem color="#3366cc" onChange={() => {}} />);
    const labels = Array.from(
      container.querySelectorAll('input[type="range"]'),
    ).map((el) => el.getAttribute('aria-label'));
    expect(labels).toContain('HSL Hue');
    expect(labels).toContain('OKLCH Hue');
    expect(labels).toContain('HSL Lightness');
    expect(labels).toContain('OKLCH Lightness');
    // All distinct.
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('wraps the picker in a labeled group', () => {
    const { container } = render(<ColorSystem color="#3366cc" onChange={() => {}} />);
    const group = container.querySelector('[role="group"]');
    expect(group?.getAttribute('aria-label')).toBe('Color picker');
  });

  it('hex input is associated with its label', () => {
    const { container } = render(<ColorSystem color="#3366cc" onChange={() => {}} />);
    const hex = container.querySelector('input[type="text"]') as HTMLInputElement;
    const label = container.querySelector(`label[for="${hex.id}"]`);
    expect(label?.textContent).toBe('HEX');
  });
});

// Direct branch coverage for the normalization helpers. Component-level
// tests cannot reliably reach the NaN/Infinity/-0 paths (no realistic color
// triggers them), so the guards are unit-tested at the source.
// Signature: normalizeChannelValue(value, min, max).
describe('normalizeChannelValue', () => {
  it('passes in-range finite values through unchanged', () => {
    expect(normalizeChannelValue(128, 0, 255)).toBe(128);
    expect(normalizeChannelValue(0.37, 0, 1)).toBe(0.37);
  });

  it('clamps a finite value above max down to max', () => {
    // Out-of-gamut OKLCH → finite RGB like r=1.32 → 337 on a 0-255 channel.
    expect(normalizeChannelValue(337, 0, 255)).toBe(255);
    expect(normalizeChannelValue(2.03, 0, 1)).toBe(1);
  });

  it('clamps a finite value below min up to min', () => {
    expect(normalizeChannelValue(-115, 0, 255)).toBe(0);
    expect(normalizeChannelValue(-0.5, 0, 1)).toBe(0);
  });

  it('normalizes negative zero to positive zero', () => {
    const out = normalizeChannelValue(-0, 0, 255);
    expect(Object.is(out, -0)).toBe(false);
    expect(out).toBe(0);
  });

  it('falls back to min for NaN', () => {
    expect(normalizeChannelValue(Number.NaN, 5, 100)).toBe(5);
  });

  it('falls back to min for +Infinity and -Infinity', () => {
    expect(normalizeChannelValue(Number.POSITIVE_INFINITY, 7, 100)).toBe(7);
    expect(normalizeChannelValue(Number.NEGATIVE_INFINITY, 7, 100)).toBe(7);
  });

  it('sign-normalizes even a -0 min fallback', () => {
    const out = normalizeChannelValue(Number.NaN, -0, 100);
    expect(Object.is(out, -0)).toBe(false);
    expect(out).toBe(0);
  });
});

describe('formatChannelDisplay', () => {
  it('renders integers bare', () => {
    expect(formatChannelDisplay(255)).toBe('255');
    expect(formatChannelDisplay(0)).toBe('0');
  });

  it('renders fractionals at 2 decimal places', () => {
    expect(formatChannelDisplay(0.3)).toBe('0.30');
    expect(formatChannelDisplay(0.125)).toBe('0.13');
  });

  it('strips the "-0.00" rounding artifact to "0.00"', () => {
    // -0.001 rounds to "-0.00" via toFixed — must not surface a signed zero.
    expect(formatChannelDisplay(-0.001)).toBe('0.00');
  });

  it('keeps a genuine small negative readable', () => {
    expect(formatChannelDisplay(-0.04)).toBe('-0.04');
  });
});

describe('ColorSystem — value rendering', () => {
  it('every slider has a matching finite-valued readout', () => {
    const { container } = render(
      <ColorSystem color="#000001" onChange={() => {}} />,
    );
    const sliders = container.querySelectorAll('input[type="range"]');
    expect(sliders).toHaveLength(9);
    for (const el of sliders) {
      const v = Number((el as HTMLInputElement).value);
      expect(Number.isFinite(v)).toBe(true);
    }
    // No slider's screen-reader readout carries a signed zero.
    for (const el of sliders) {
      expect(el.getAttribute('aria-valuetext')).not.toMatch(/-0(\.0+)?(%|°)?$/);
    }
  });

  it('falls back to #000000 for an unparseable color string', () => {
    const { container } = render(
      <ColorSystem color="not-a-color" onChange={() => {}} />,
    );
    expect(container.querySelectorAll('input[type="range"]')).toHaveLength(9);
    const hex = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(hex.value).toBe('#000000');
  });

  it('clamps out-of-gamut OKLCH conversions into each slider bound', () => {
    // High-chroma OKLCH is far outside sRGB — conversions yield finite but
    // off-scale RGB/HSL values. Every range input must stay within its
    // own [min,max] (council gate: codex gpt-5.5 + gemini-3).
    const { container } = render(
      <ColorSystem color="oklch(0.9 0.4 30)" onChange={() => {}} />,
    );
    const sliders = container.querySelectorAll('input[type="range"]');
    expect(sliders).toHaveLength(9);
    for (const el of sliders) {
      const input = el as HTMLInputElement;
      const v = Number(input.value);
      expect(v).toBeGreaterThanOrEqual(Number(input.min));
      expect(v).toBeLessThanOrEqual(Number(input.max));
    }
  });
});

describe('ColorSystem — echo suppression is bounded', () => {
  const hexOf = (c: HTMLElement) => (c.querySelector('input[type="text"]') as HTMLInputElement).value;
  const oklchL = (c: HTMLElement) => (c.querySelector('input[aria-label="OKLCH Lightness"]') as HTMLInputElement).value;

  it('ignores late in-flight echoes of its own emissions', () => {
    const seen: string[] = [];
    const { container, rerender } = render(<ColorSystem color="oklch(50% 0.1 200)" onChange={(c) => seen.push(c)} />);
    const l = container.querySelector('input[aria-label="OKLCH Lightness"]') as HTMLInputElement;
    fireEvent.change(l, { target: { value: '60' } });
    fireEvent.change(l, { target: { value: '70' } });
    expect(seen).toHaveLength(2);
    rerender(<ColorSystem color={seen[0]!} onChange={() => {}} />); // stale echo arrives late
    expect(oklchL(container)).toBe('70');
  });

  it('applies an external value equal to an earlier emission once the parent has caught up (A→B→A→C, reset to A)', () => {
    const seen: string[] = [];
    let onChange = (c: string) => seen.push(c);
    const { container, rerender } = render(<ColorSystem color="#000000" onChange={(c) => onChange(c)} />);
    const hex = container.querySelector('input[type="text"]') as HTMLInputElement;
    for (const v of ['#ff0000', '#00ff00', '#ff0000', '#0000ff']) fireEvent.change(hex, { target: { value: v } });
    const [, , a, cEmit] = seen;
    rerender(<ColorSystem color={cEmit!} onChange={(c) => onChange(c)} />); // parent caught up at C
    rerender(<ColorSystem color={a!} onChange={(c) => onChange(c)} />); // Reset All → A
    expect(hexOf(container)).toBe('#ff0000');
    void onChange;
  });
});
