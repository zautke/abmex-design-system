import { describe, expect, it } from 'vitest';
import { ConfigError, clientConfigSchema, foldTurn, hashEvent, parseConfig, validateEvent, type TurnStreamEvent } from '../src/index.js';

// Ponytail check: the one piece of non-trivial pure logic in the root entry. A recorded stream
// (shape of Merlyn's HarnessEvent) must fold to a deterministic, replayable event list.
const stream: Array<{ ev: TurnStreamEvent; at: number }> = [
  { ev: { type: 'reasoning-delta', id: 'r1', text: 'think ' }, at: 0 },
  { ev: { type: 'reasoning-delta', id: 'r1', text: 'more' }, at: 100 },
  { ev: { type: 'text-delta', id: 't1', text: 'Hel' }, at: 120 },
  { ev: { type: 'text-delta', id: 't1', text: 'lo' }, at: 400 }, // > 250 ms since the part opened => flush
  { ev: { type: 'tool-input-start', toolCallId: 'c1', toolName: 'vfs_read' }, at: 450 },
  { ev: { type: 'tool-input-delta', toolCallId: 'c1', argsTextDelta: '{"path":"/a"}' }, at: 460 },
  { ev: { type: 'tool-call', toolCallId: 'c1', toolName: 'vfs_read', input: { path: '/a' } }, at: 470 },
  { ev: { type: 'tool-result', toolCallId: 'c1', toolName: 'vfs_read', output: 'contents' }, at: 600 },
  { ev: { type: 'text-delta', id: 't2', text: ' world' }, at: 610 },
  { ev: { type: 'step-finish', usage: { input: 10, output: 5 } }, at: 700 },
  { ev: { type: 'finish', reason: 'stop', usage: { input: 10, output: 5 } }, at: 710 },
];

const opts = { conversationId: 'conv1', turnId: 'turn1', assistantMessageId: 'a1' };

describe('foldTurn', () => {
  it('folds a recorded stream into ordered, validated log events', () => {
    const events = foldTurn(opts, stream);
    const types = events.map((e) => `${e.type}:${(e.payload as { state?: string }).state ?? ''}`.replace(/:$/, ''));
    expect(types).toEqual([
      'part.appended', // reasoning r1
      'part.appended', // text t1
      'part.delta', // 'Hello' coalesced at 400 ms
      'part.delta', // reasoning 'think more' flushed by the tool boundary
      'part.appended', // tool c1
      'part.state:input-streaming',
      'part.state:running',
      'part.state:output-available',
      'part.appended', // text t2
      'part.delta', // ' world' flushed by step-finish
      'usage.recorded',
      'turn.finished',
    ]);
    const deltas = events.filter((e) => e.type === 'part.delta').map((e) => e.payload as { partId: string; offset: number; text: string });
    expect(deltas[0]).toMatchObject({ partId: 'a1:text:t1', offset: 0, text: 'Hello' });
    expect(deltas[1]).toMatchObject({ partId: 'a1:reasoning:r1', offset: 0, text: 'think more' });
    for (const e of events) expect(validateEvent(e)).toMatchObject({ known: true });
    expect(events.at(-1)?.payload).toMatchObject({ reason: 'stop', durationMs: 710 });
  });

  it('closes an unsettled tool call as interrupted when the turn ends', () => {
    const events = foldTurn(opts, [
      { ev: { type: 'tool-call', toolCallId: 'c9', toolName: 'slow', input: {} }, at: 0 },
      { ev: { type: 'abort' }, at: 50 },
    ]);
    const states = events.filter((e) => e.type === 'part.state').map((e) => (e.payload as { state: string }).state);
    expect(states).toEqual(['running', 'interrupted']);
    expect(events.at(-1)?.payload).toMatchObject({ reason: 'abort' });
  });

  it('is replayable: the same stream folds to the same hashes', async () => {
    const a = await Promise.all(foldTurn(opts, stream).map(hashEvent));
    const b = await Promise.all(foldTurn(opts, stream).map(hashEvent));
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(a.length);
  });
});

describe('parseConfig', () => {
  it('names the missing key and the source', () => {
    expect(() => parseConfig(clientConfigSchema, { VITE_ABMEX_AI_GATEWAY_URL: 'http://127.0.0.1:1' }, '.env', 'VITE_')).toThrowError(
      /config \(\.env\): missing: ABMEX_AI_SECRET/,
    );
    try {
      parseConfig(clientConfigSchema, {}, 'import.meta.env');
    } catch (e) {
      expect(e).toBeInstanceOf(ConfigError);
      expect((e as ConfigError).missing).toEqual(['ABMEX_AI_GATEWAY_URL', 'ABMEX_AI_SECRET']);
    }
  });
  it('strips a prefix so VITE_ twins satisfy the client schema', () => {
    const c = parseConfig(clientConfigSchema, { VITE_ABMEX_AI_GATEWAY_URL: 'http://127.0.0.1:12345', VITE_ABMEX_AI_SECRET: 'x'.repeat(16) }, '.env', 'VITE_');
    expect(c.ABMEX_AI_GATEWAY_URL).toBe('http://127.0.0.1:12345');
  });
});
