// @vitest-environment jsdom
//
// The two header readouts. Their whole job is to be honest about what a
// provider reported, so these tests are mostly about the difference between
// "not reported" and "zero".
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ContextWindowTracker, TokenCounter } from '@abmex/ui';

afterEach(cleanup);

const reported = {
  providerId: 'anthropic',
  source: 'reported' as const,
  inputTokens: 12_000,
  outputTokens: 400,
};

describe('TokenCounter', () => {
  it('renders n/a for a count the provider never reported, and 0 for a reported zero', () => {
    render(
      <TokenCounter
        latest={{ providerId: 'ollama', source: 'reported', outputTokens: 0 }}
        cumulative={null}
      />,
    );
    const latest = screen.getByLabelText('Latest roundtrip tokens');
    expect(latest.textContent).toContain('n/a'); // input was never reported
    expect(latest.textContent).toContain('0'); // output really was zero
  });

  it('hides the cache segment entirely when the provider reports no cache fields', () => {
    render(<TokenCounter latest={{ ...reported }} cumulative={null} />);
    expect(screen.queryByLabelText('Prompt cache: tokens read and written')).toBeNull();
  });

  it('shows cache tokens with a hit rate when they are reported', () => {
    render(
      <TokenCounter
        latest={{ ...reported, cacheReadInputTokens: 9_000, cacheWriteInputTokens: 1_000 }}
        cumulative={null}
      />,
    );
    const cache = screen.getByLabelText('Prompt cache: tokens read and written');
    expect(cache.textContent).toContain('9.0k');
    expect(cache.textContent).toContain('75%');
  });

  it('marks an estimated reading with ~', () => {
    render(<TokenCounter latest={{ ...reported, source: 'estimated' }} cumulative={null} />);
    expect(screen.getByLabelText('estimated').textContent).toBe('~');
  });

  it('shows the conversation cost when it could be priced', () => {
    render(
      <TokenCounter
        latest={{ ...reported }}
        cumulative={{ ...reported, cost: { total: 0.1234, input: 0.1 } }}
      />,
    );
    expect(screen.getByLabelText('Conversation cost').textContent).toBe('$0.12');
  });

  it('falls back to "Tokens n/a" with no records at all', () => {
    render(<TokenCounter latest={null} cumulative={null} />);
    expect(screen.getByText('Tokens n/a')).toBeTruthy();
  });
});

describe('ContextWindowTracker', () => {
  it('renders a meter whose value is the available share', () => {
    render(
      <ContextWindowTracker
        meter={{
          window: 100_000,
          baseline: 0,
          used: 40_000,
          reserved: 25_000,
          available: 35_000,
          percentAvailable: 47,
          estimated: false,
        }}
      />,
    );
    const meter = screen.getByRole('meter');
    expect(meter.getAttribute('aria-valuenow')).toBe('47');
    expect(meter.textContent).toContain('47% left');
  });

  it('says n/a when the model context window is unknown', () => {
    render(
      <ContextWindowTracker
        meter={{ baseline: 0, used: 1_000, reserved: 0, available: 0, estimated: true }}
      />,
    );
    expect(screen.getByText('Context n/a')).toBeTruthy();
  });

  it('marks an estimated reading with ~', () => {
    render(
      <ContextWindowTracker
        meter={{
          window: 10_000,
          baseline: 0,
          used: 1_000,
          reserved: 2_500,
          available: 6_500,
          percentAvailable: 86,
          estimated: true,
        }}
      />,
    );
    expect(screen.getByRole('meter').textContent).toContain('~86% left');
  });
});
