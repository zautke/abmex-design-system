import {
  PartAppended,
  PartDelta,
  PartState,
  TurnFinished,
  UsageRecorded,
  aggregateFor,
  makeEvent,
  type EventEnvelope,
  type Usage,
} from './events.js';

/**
 * The stream events a provider-agnostic agent loop emits (Merlyn `HarnessEvent`, AI SDK v7
 * `runTurn`). Only the fields the fold reads are typed; extra fields pass through untouched.
 */
export type TurnStreamEvent =
  | { type: 'text-delta'; id: string; text: string }
  | { type: 'reasoning-delta'; id: string; text: string }
  | { type: 'tool-input-start'; toolCallId: string; toolName: string }
  | { type: 'tool-input-delta'; toolCallId: string; argsTextDelta: string }
  | { type: 'tool-call'; toolCallId: string; toolName: string; input: unknown }
  | { type: 'tool-result'; toolCallId: string; toolName: string; output: unknown }
  | { type: 'tool-error'; toolCallId: string; toolName: string; error: string }
  | { type: 'step-finish'; usage: Usage }
  | { type: 'finish'; reason: 'stop' | 'max-steps' | 'doom-loop' | 'abort' | 'error'; usage: Usage }
  | { type: 'error'; error: { kind: string; message: string } }
  | { type: 'abort' };

export interface TurnFolderOptions {
  conversationId: string;
  turnId: string;
  assistantMessageId: string;
  /** Delta coalescing window (plan C4/G6). Default 250 ms. */
  coalesceMs?: number;
  /** Deterministic part ids for tests; default `${messageId}:${kind}:${n}`. */
  partId?: (kind: 'text' | 'reasoning' | 'tool', key: string) => string;
}

interface OpenText {
  partId: string;
  buffered: string;
  offset: number;
  since: number;
}

/**
 * Pure fold of a turn's stream into log events (plan C4, G6, research §2.2 rules). No timers: the
 * caller passes `now` to `push()` and must call `flush(now)` at the end. Text/reasoning deltas are
 * coalesced per part within `coalesceMs`; tool and step transitions are emitted immediately and
 * flush any pending text first so ordering survives a replay.
 */
export class TurnFolder {
  private readonly o: Required<Pick<TurnFolderOptions, 'conversationId' | 'turnId' | 'assistantMessageId' | 'coalesceMs'>>;
  private readonly partIdFor: NonNullable<TurnFolderOptions['partId']>;
  private readonly conv: string;
  private readonly open = new Map<string, OpenText>(); // key = `${kind}:${streamId}`
  private readonly tools = new Map<string, { partId: string; args: string }>();
  private readonly seen = new Set<string>();
  private step = 0;
  private startedAt: number | undefined;
  private done = false;

  constructor(options: TurnFolderOptions) {
    this.o = { coalesceMs: 250, ...options };
    this.partIdFor = options.partId ?? ((kind, key) => `${options.assistantMessageId}:${kind}:${key}`);
    this.conv = aggregateFor.conversation(options.conversationId);
  }

  /** Fold one stream event; returns the log events to append now (possibly none). */
  push(ev: TurnStreamEvent, now: number): EventEnvelope[] {
    if (this.done) return [];
    this.startedAt ??= now;
    const out: EventEnvelope[] = [];
    switch (ev.type) {
      case 'text-delta':
      case 'reasoning-delta': {
        const kind = ev.type === 'text-delta' ? 'text' : 'reasoning';
        const key = `${kind}:${ev.id}`;
        let t = this.open.get(key);
        if (!t) {
          t = { partId: this.partIdFor(kind, ev.id), buffered: '', offset: 0, since: now };
          this.open.set(key, t);
          out.push(this.appended(t.partId, kind, now));
        }
        t.buffered += ev.text;
        if (now - t.since >= this.o.coalesceMs) out.push(...this.flushText(t, now));
        return out;
      }
      case 'tool-input-start': {
        out.push(...this.flushAll(now));
        const partId = this.partIdFor('tool', ev.toolCallId);
        this.tools.set(ev.toolCallId, { partId, args: '' });
        out.push(this.appended(partId, 'tool', now, ev.toolCallId, ev.toolName));
        out.push(this.state(partId, 'input-streaming', now));
        return out;
      }
      case 'tool-input-delta': {
        const t = this.tools.get(ev.toolCallId);
        if (t) t.args += ev.argsTextDelta;
        return out;
      }
      case 'tool-call': {
        out.push(...this.flushAll(now));
        let t = this.tools.get(ev.toolCallId);
        if (!t) {
          t = { partId: this.partIdFor('tool', ev.toolCallId), args: '' };
          this.tools.set(ev.toolCallId, t);
          out.push(this.appended(t.partId, 'tool', now, ev.toolCallId, ev.toolName));
        }
        out.push(this.state(t.partId, 'running', now, { input: ev.input }));
        return out;
      }
      case 'tool-result': {
        out.push(...this.flushAll(now));
        const t = this.tools.get(ev.toolCallId);
        if (t) out.push(this.state(t.partId, 'output-available', now, { output: ev.output }));
        return out;
      }
      case 'tool-error': {
        out.push(...this.flushAll(now));
        const t = this.tools.get(ev.toolCallId);
        if (t) out.push(this.state(t.partId, 'output-error', now, { errorText: ev.error }));
        return out;
      }
      case 'step-finish': {
        out.push(...this.flushAll(now));
        out.push(
          makeEvent(UsageRecorded, this.conv, { conversationId: this.o.conversationId, turnId: this.o.turnId, step: this.step++, usage: ev.usage }, now),
        );
        return out;
      }
      case 'finish':
        return this.finish(now, ev.reason, ev.usage);
      case 'error':
        return this.finish(now, 'error', undefined, ev.error);
      case 'abort':
        return this.finish(now, 'abort');
    }
  }

  /** Emit any buffered deltas (call at a timer tick or before the turn ends). */
  flush(now: number): EventEnvelope[] {
    return this.flushAll(now);
  }

  /** Open tool calls that never settled; the caller closes them as `interrupted` when the turn is swept. */
  openToolParts(): string[] {
    return [...this.tools.values()].map((t) => t.partId).filter((id) => !this.seen.has(id));
  }

  private finish(now: number, reason: 'stop' | 'max-steps' | 'doom-loop' | 'abort' | 'error', usage?: Usage, error?: { kind: string; message: string }) {
    const out = this.flushAll(now);
    for (const partId of this.openToolParts()) out.push(this.state(partId, 'interrupted', now, { errorText: `turn ended: ${reason}` }));
    const payload: Parameters<typeof makeEvent<typeof TurnFinished>>[2] = { conversationId: this.o.conversationId, turnId: this.o.turnId, reason };
    if (usage) payload.usage = usage;
    if (error) payload.error = error;
    if (this.startedAt !== undefined) payload.durationMs = Math.max(0, now - this.startedAt);
    out.push(makeEvent(TurnFinished, this.conv, payload, now));
    this.done = true;
    return out;
  }

  private flushAll(now: number): EventEnvelope[] {
    const out: EventEnvelope[] = [];
    for (const t of this.open.values()) out.push(...this.flushText(t, now));
    return out;
  }

  private flushText(t: OpenText, now: number): EventEnvelope[] {
    if (!t.buffered) return [];
    const e = makeEvent(
      PartDelta,
      this.conv,
      { conversationId: this.o.conversationId, messageId: this.o.assistantMessageId, partId: t.partId, offset: t.offset, text: t.buffered },
      now,
    );
    t.offset += t.buffered.length;
    t.buffered = '';
    t.since = now;
    return [e];
  }

  private appended(partId: string, kind: 'text' | 'reasoning' | 'tool', now: number, toolCallId?: string, toolName?: string): EventEnvelope {
    const payload: Parameters<typeof makeEvent<typeof PartAppended>>[2] = { conversationId: this.o.conversationId, messageId: this.o.assistantMessageId, partId, kind };
    if (toolCallId) payload.toolCallId = toolCallId;
    if (toolName) payload.toolName = toolName;
    return makeEvent(PartAppended, this.conv, payload, now);
  }

  private state(
    partId: string,
    state: 'input-streaming' | 'input-available' | 'running' | 'output-available' | 'output-error' | 'interrupted',
    now: number,
    extra: { input?: unknown; output?: unknown; errorText?: string } = {},
  ): EventEnvelope {
    if (state === 'output-available' || state === 'output-error' || state === 'interrupted') this.seen.add(partId);
    const payload: Parameters<typeof makeEvent<typeof PartState>>[2] = { conversationId: this.o.conversationId, messageId: this.o.assistantMessageId, partId, state };
    if ('input' in extra) payload.input = extra.input;
    if ('output' in extra) payload.output = extra.output;
    if (extra.errorText !== undefined) payload.errorText = extra.errorText;
    return makeEvent(PartState, this.conv, payload, now);
  }
}

/** One-shot convenience: fold a whole recorded stream (each item carries its wall-clock `at`). */
export function foldTurn(options: TurnFolderOptions, stream: Iterable<{ ev: TurnStreamEvent; at: number }>): EventEnvelope[] {
  const f = new TurnFolder(options);
  const out: EventEnvelope[] = [];
  let last = 0;
  for (const { ev, at } of stream) {
    out.push(...f.push(ev, at));
    last = at;
  }
  out.push(...f.flush(last));
  return out;
}
