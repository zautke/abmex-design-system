// Headless token-rate meter. Splits the *computation* of a streaming rate out
// of its presentation (see components/chat/StreamingRate.tsx) so consumers can
// render the number however they like — or read it without rendering at all.

import { useEffect, useRef, useState } from 'react';

// Minimum observation window before displaying live TPS — prevents near-zero elapsed
// divisions caused by the interval firing within milliseconds of the first-token ref being set.
const LIVE_TPS_MIN_ELAPSED_S = 0.5;
// Minimum content before estimating tokens — avoids inflated rates from single-token bursts.
const LIVE_TPS_MIN_CHARS = 40;
// Conservative chars-per-token ratio (GPT-4 / Llama averages ~4 chars/token).
const CHARS_PER_TOKEN = 4;

/**
 * Provider-reported generation totals. Structurally satisfied by the domain
 * `TokenUsage` type, but deliberately not imported from it — this hook knows
 * nothing about providers or conversations.
 */
export interface StreamingRateUsage {
  outputTokens?: number;
  /** Generation duration in nanoseconds (e.g. Ollama `eval_duration`). */
  generationDurationNs?: number;
}

export interface UseStreamingRateInput {
  /** The accumulating message text. Length drives the token estimate. */
  content: string;
  streaming?: boolean;
  usage?: StreamingRateUsage;
}

export interface StreamingRateReading {
  value: number;
  /** `t/s` above one token per second, `t/m` below it. */
  unit: 't/s' | 't/m';
  /** True while sampled from a live timer; false once the final figure is settled. */
  live: boolean;
}

function toReading(tps: number, live: boolean): StreamingRateReading {
  return tps >= 1
    ? { value: tps, unit: 't/s', live }
    : { value: tps * 60, unit: 't/m', live };
}

/**
 * Returns the current generation rate, or `null` before enough has streamed to
 * quote one honestly. While `streaming`, it samples on a ~6 Hz timer; once
 * streaming ends it settles on provider-reported `usage` when available and
 * falls back to a wall-clock estimate when not.
 */
export function useStreamingRate({
  content,
  streaming,
  usage,
}: UseStreamingRateInput): StreamingRateReading | null {
  const firstTokenTimeRef = useRef<number | null>(null);
  const contentRef = useRef(content);
  const [display, setDisplay] = useState<StreamingRateReading | null>(null);

  contentRef.current = content;

  useEffect(() => {
    if (content.length > 0 && firstTokenTimeRef.current === null) {
      firstTokenTimeRef.current = Date.now();
    }
  }, [content]);

  useEffect(() => {
    if (!streaming) return;
    const id = setInterval(() => {
      if (firstTokenTimeRef.current === null) return;
      const elapsed = (Date.now() - firstTokenTimeRef.current) / 1000;
      if (elapsed < LIVE_TPS_MIN_ELAPSED_S) return;
      const current = contentRef.current;
      if (current.length < LIVE_TPS_MIN_CHARS) return;
      const estTokens = current.length / CHARS_PER_TOKEN;
      setDisplay(toReading(estTokens / elapsed, true));
    }, Math.round(1000 / 6));
    return () => clearInterval(id);
  }, [streaming]);

  useEffect(() => {
    if (streaming || firstTokenTimeRef.current === null) return;
    const tokens = usage?.outputTokens ?? Math.round(contentRef.current.length / CHARS_PER_TOKEN);
    const elapsed =
      usage?.generationDurationNs != null
        ? usage.generationDurationNs / 1_000_000_000
        : (Date.now() - firstTokenTimeRef.current) / 1000;
    if (elapsed < 0.1) return;
    setDisplay(toReading(tokens / elapsed, false));
  }, [streaming, usage?.outputTokens, usage?.generationDurationNs]);

  return display;
}
