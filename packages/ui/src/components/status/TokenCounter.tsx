import { ArrowBigDown, ArrowBigUp, ArrowDown, ArrowUp, Brain, Database } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { TokenUsage } from '../../types/conversation';

export interface TokenCounterProps {
  // WIRING: the consumer hands over canonical usage records (shared/usage).
  // `latest` is the newest turn, `cumulative` the whole conversation. The view
  // does no arithmetic beyond formatting and the cache-hit ratio.
  latest: TokenUsage | null;
  cumulative: TokenUsage | null;
  /** The active provider reports no usage data. */
  unavailable?: boolean;
  className?: string;
}

/**
 * Renders only what a provider actually reported.
 *
 * `undefined` means "never reported" and renders as nothing (or n/a) — not as
 * zero. Ollama reports no cache fields at all, so showing "0 cached" for an
 * Ollama turn would state a fact nobody measured. A `~` marks a number the
 * tokenizer estimated because the provider returned no usage (an aborted turn,
 * or a provider that reports none).
 */
export function TokenCounter({
  latest,
  cumulative,
  unavailable = false,
  className,
}: TokenCounterProps) {
  if (unavailable || (!latest && !cumulative)) {
    return (
      <div
        className={cn(
          'text-xs font-medium uppercase tracking-[0.14em] text-ph-fg-muted',
          className,
        )}
      >
        Tokens n/a
      </div>
    );
  }

  const estimated = latest?.source !== undefined && latest.source !== 'reported';
  const cacheRead = latest?.cacheReadInputTokens;
  const cacheWrite = latest?.cacheWriteInputTokens;
  const hitRate = cacheHitRate(latest);
  const cost = cumulative?.cost?.total;

  return (
    <div className={cn('flex items-center gap-3 text-xs font-medium text-ph-fg-muted', className)}>
      <div className="flex items-center gap-1" aria-label="Latest roundtrip tokens" title={describe(latest)}>
        {estimated && <span aria-label="estimated">~</span>}
        <ArrowUp size={12} strokeWidth={1.5} />
        <span>{formatTokenCount(latest?.inputTokens)}</span>
        <ArrowDown size={12} strokeWidth={1.5} />
        <span>{formatTokenCount(latest?.outputTokens)}</span>
      </div>

      {(cacheRead !== undefined || cacheWrite !== undefined) && (
        <div
          className="flex items-center gap-1"
          aria-label="Prompt cache: tokens read and written"
          title={[
            `cache read ${formatTokenCount(cacheRead)}`,
            `cache write ${formatTokenCount(cacheWrite)}`,
            hitRate !== undefined ? `${hitRate}% of the prompt was cached` : null,
          ]
            .filter(Boolean)
            .join('\n')}
        >
          <Database size={12} strokeWidth={1.5} />
          <span>{formatTokenCount(cacheRead)}</span>
          {hitRate !== undefined && <span className="text-ph-fg-muted">({hitRate}%)</span>}
        </div>
      )}

      {latest?.reasoningOutputTokens !== undefined && (
        <div className="flex items-center gap-1" aria-label="Reasoning tokens">
          <Brain size={12} strokeWidth={1.5} />
          <span>{formatTokenCount(latest.reasoningOutputTokens)}</span>
        </div>
      )}

      <div className="flex items-center gap-1" aria-label="Cumulative conversation tokens">
        <ArrowBigUp size={13} strokeWidth={1.8} />
        <span>{formatTokenCount(cumulative?.inputTokens)}</span>
        <ArrowBigDown size={13} strokeWidth={1.8} />
        <span>{formatTokenCount(cumulative?.outputTokens)}</span>
      </div>

      {cost !== undefined && (
        <span aria-label="Conversation cost" title={describeCost(cumulative)}>
          {formatCost(cost)}
        </span>
      )}
    </div>
  );
}

/** Share of the prompt served from cache — the ratio, not just the count. */
function cacheHitRate(usage: TokenUsage | null): number | undefined {
  if (!usage?.cacheReadInputTokens || !usage.inputTokens) return undefined;
  return Math.round((usage.cacheReadInputTokens / usage.inputTokens) * 100);
}

function describe(usage: TokenUsage | null): string | undefined {
  if (!usage) return undefined;
  return [
    `input ${formatTokenCount(usage.inputTokens)}`,
    usage.noCacheInputTokens !== undefined ? `uncached ${formatTokenCount(usage.noCacheInputTokens)}` : null,
    `output ${formatTokenCount(usage.outputTokens)}`,
    usage.source && usage.source !== 'reported' ? `${usage.source} — not fully reported by the provider` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

function describeCost(usage: TokenUsage | null): string | undefined {
  const cost = usage?.cost;
  if (!cost) return undefined;
  return [
    cost.input !== undefined ? `input ${formatCost(cost.input)}` : null,
    cost.cacheRead !== undefined ? `cache read ${formatCost(cost.cacheRead)}` : null,
    cost.cacheWrite !== undefined ? `cache write ${formatCost(cost.cacheWrite)}` : null,
    cost.output !== undefined ? `output ${formatCost(cost.output)}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

function formatCost(value: number): string {
  if (value === 0) return '$0';
  return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
}

/** `undefined` is "not reported" and renders as n/a; 0 renders as 0. */
function formatTokenCount(value: number | undefined): string {
  if (value === undefined) return 'n/a';
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  }
  return String(value);
}
