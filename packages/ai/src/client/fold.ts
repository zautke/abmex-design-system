import { AGGREGATE_PREFIX, type ToolState, type Usage } from '../events.js';
import type { LogEventRow } from './db.js';
import type { Log } from './log.js';

/**
 * Fold-on-read projections (plan C2, C14). Each fold is a pure reducer over an aggregate's event
 * slice; `foldIncremental` applies only `seq > state.throughSeq`. Unknown or post-terminal events
 * are kept visible as `anomalies` (never dropped silently, review N1).
 */

export interface PartView {
  partId: string;
  kind: 'text' | 'reasoning' | 'tool' | 'image';
  text: string;
  toolCallId?: string | undefined;
  toolName?: string | undefined;
  state?: ToolState | undefined;
  input?: unknown;
  output?: unknown;
  errorText?: string | undefined;
  excluded?: boolean | undefined;
}

export interface MessageView {
  messageId: string;
  role: 'user' | 'assistant' | 'system' | 'notice';
  kind?: string | undefined;
  turnId?: string | undefined;
  text: string;
  parts: PartView[];
  images: Array<{ sha256: string; mime: string; width?: number | undefined; height?: number | undefined }>;
  status: 'streaming' | 'complete' | 'interrupted' | 'error';
  createdAt: number;
  usage?: Usage | undefined;
}

export interface TurnView {
  turnId: string;
  assistantMessageId: string;
  startedAt: number;
  finishedAt?: number | undefined;
  reason?: string | undefined;
  usage?: Usage | undefined;
  status: 'open' | 'finished' | 'interrupted';
}

export interface ConversationView {
  conversationId: string;
  title: string;
  titleSource: 'default' | 'auto' | 'manual';
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
  messages: MessageView[];
  turns: Record<string, TurnView>;
  anomalies: Array<{ seq: number; reason: string }>;
  throughSeq: number;
}

export function emptyConversation(conversationId: string): ConversationView {
  return { conversationId, title: 'New Chat', titleSource: 'default', createdAt: 0, updatedAt: 0, deleted: false, messages: [], turns: {}, anomalies: [], throughSeq: 0 };
}

export function reduceConversation(state: ConversationView, row: LogEventRow): ConversationView {
  const s = state; // mutated in place; callers clone when they need immutability
  const p = row.payload as Record<string, unknown>;
  const msg = (id: unknown) => s.messages.find((m) => m.messageId === id);
  const turnOf = (id: unknown) => s.turns[String(id)];
  switch (row.type) {
    case 'conversation.created':
      s.title = String(p.title ?? s.title);
      s.createdAt ||= row.ts;
      break;
    case 'conversation.renamed':
      s.title = String(p.title);
      s.titleSource = p.source === 'manual' ? 'manual' : 'auto';
      break;
    case 'conversation.deleted':
      s.deleted = true;
      break;
    case 'conversation.cleared':
      s.messages = [];
      s.turns = {};
      break;
    case 'conversation.snapshot': {
      const snap = p.state as ConversationView | undefined;
      if (snap && typeof snap === 'object') Object.assign(s, structuredClone(snap), { throughSeq: row.seq });
      break;
    }
    case 'turn.started': {
      const turnId = String(p.turnId);
      s.turns[turnId] = { turnId, assistantMessageId: String(p.assistantMessageId), startedAt: row.ts, status: 'open' };
      break;
    }
    case 'turn.finished':
    case 'turn.interrupted': {
      const t = turnOf(p.turnId);
      if (!t) break;
      if (t.status !== 'open') {
        s.anomalies.push({ seq: row.seq, reason: `${row.type} after terminal for turn ${t.turnId}` });
        break;
      }
      t.status = row.type === 'turn.finished' ? 'finished' : 'interrupted';
      t.finishedAt = row.ts;
      if (row.type === 'turn.finished') {
        t.reason = String(p.reason);
        t.usage = p.usage as Usage | undefined;
      }
      const m = msg(t.assistantMessageId);
      if (m) {
        m.status = row.type === 'turn.interrupted' ? 'interrupted' : p.reason === 'error' ? 'error' : p.reason === 'abort' ? 'interrupted' : 'complete';
        if (t.usage) m.usage = t.usage;
      }
      break;
    }
    case 'message.appended': {
      const images = (p.images as MessageView['images'] | undefined) ?? [];
      s.messages.push({
        messageId: String(p.messageId),
        role: p.role as MessageView['role'],
        kind: p.kind as string | undefined,
        turnId: p.turnId as string | undefined,
        text: String(p.text ?? ''),
        parts: [],
        images,
        status: p.role === 'assistant' ? 'streaming' : 'complete',
        createdAt: row.ts,
      });
      break;
    }
    case 'part.appended': {
      const m = msg(p.messageId);
      if (!m) break;
      m.parts.push({ partId: String(p.partId), kind: p.kind as PartView['kind'], text: '', toolCallId: p.toolCallId as string | undefined, toolName: p.toolName as string | undefined });
      break;
    }
    case 'part.delta': {
      const part = msg(p.messageId)?.parts.find((x) => x.partId === p.partId);
      if (!part) break;
      const offset = Number(p.offset);
      // Idempotent by offset (C13): a replayed or out-of-order delta never duplicates text.
      if (offset === part.text.length) part.text += String(p.text);
      else if (offset < part.text.length) {
        /* already applied */
      } else s.anomalies.push({ seq: row.seq, reason: `delta gap on ${part.partId}: have ${part.text.length}, got offset ${offset}` });
      break;
    }
    case 'part.state': {
      const part = msg(p.messageId)?.parts.find((x) => x.partId === p.partId);
      if (!part) break;
      part.state = p.state as ToolState;
      if ('input' in p) part.input = p.input;
      if ('output' in p) part.output = p.output;
      if (p.errorText !== undefined) part.errorText = String(p.errorText);
      break;
    }
    case 'part.excluded': {
      const part = msg(p.messageId)?.parts.find((x) => x.partId === p.partId);
      if (part) part.excluded = Boolean(p.excluded);
      break;
    }
    case 'usage.recorded':
      break;
    case 'imported.row':
      break; // the Merlyn importer folds its own rows (plan S3); the package only stores them
    default:
      s.anomalies.push({ seq: row.seq, reason: `unknown ${row.type}@${row.v}` });
  }
  s.updatedAt = Math.max(s.updatedAt, row.ts);
  s.throughSeq = row.seq;
  return s;
}

export interface ConversationSummary {
  conversationId: string;
  title: string;
  updatedAt: number;
  deleted: boolean;
}

/** Full fold of one conversation from its slice (or from its newest snapshot onward). */
export async function foldConversation(log: Log, conversationId: string, after = 0): Promise<ConversationView> {
  const aggregate = `${AGGREGATE_PREFIX.conversation}${conversationId}`;
  const rows = await log.readAggregate(aggregate, after);
  return rows.reduce(reduceConversation, emptyConversation(conversationId));
}

/** Incremental fold (C14): applies only rows newer than `state.throughSeq`. */
export async function foldConversationFrom(log: Log, state: ConversationView): Promise<ConversationView> {
  const aggregate = `${AGGREGATE_PREFIX.conversation}${state.conversationId}`;
  const rows = await log.readAggregate(aggregate, state.throughSeq);
  return rows.reduce(reduceConversation, state);
}

/** Conversation list: one light fold per conversation aggregate (title/updatedAt/deleted only). */
export async function foldConversationList(log: Log): Promise<ConversationSummary[]> {
  const aggregates = await log.aggregates(AGGREGATE_PREFIX.conversation);
  const out: ConversationSummary[] = [];
  for (const aggregate of aggregates) {
    const rows = await log.readAggregate(aggregate);
    let title = 'New Chat';
    let updatedAt = 0;
    let deleted = false;
    for (const r of rows) {
      const p = r.payload as Record<string, unknown>;
      if (r.type === 'conversation.created' || r.type === 'conversation.renamed') title = String(p.title ?? title);
      if (r.type === 'conversation.deleted') deleted = true;
      updatedAt = Math.max(updatedAt, r.ts);
    }
    out.push({ conversationId: aggregate.slice(AGGREGATE_PREFIX.conversation.length), title, updatedAt, deleted });
  }
  return out.filter((c) => !c.deleted).sort((a, b) => b.updatedAt - a.updatedAt);
}

export interface KvView {
  values: Record<string, unknown>;
  throughSeq: number;
}

export function reduceKv(state: KvView, row: LogEventRow): KvView {
  const p = row.payload as Record<string, unknown>;
  if (row.type === 'kv.set') state.values[String(p.key)] = p.value;
  else if (row.type === 'kv.deleted') delete state.values[String(p.key)];
  else if (row.type === 'kv.snapshot') state.values = { ...(p.state as Record<string, unknown>) };
  state.throughSeq = row.seq;
  return state;
}

export async function foldKv(log: Log, state: KvView = { values: {}, throughSeq: 0 }): Promise<KvView> {
  const rows = await log.readAggregate(AGGREGATE_PREFIX.app, state.throughSeq);
  return rows.reduce(reduceKv, state);
}

export async function foldThemes(log: Log): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const aggregate of await log.aggregates(AGGREGATE_PREFIX.theme)) {
    for (const r of await log.readAggregate(aggregate)) {
      const p = r.payload as Record<string, unknown>;
      if (r.type === 'theme.put') out[String(p.themeId)] = p.theme;
      if (r.type === 'theme.deleted') delete out[String(p.themeId)];
    }
  }
  return out;
}

export interface VfsEntry {
  path: string;
  mime: string;
  size: number;
  mtime: number;
  content?: string | undefined;
  sha256?: string | undefined;
}

export async function foldVfs(log: Log): Promise<VfsEntry[]> {
  const out = new Map<string, VfsEntry>();
  for (const aggregate of await log.aggregates(AGGREGATE_PREFIX.vfs)) {
    for (const r of await log.readAggregate(aggregate)) {
      const p = r.payload as Record<string, unknown>;
      if (r.type === 'vfs.put') out.set(String(p.path), { path: String(p.path), mime: String(p.mime), size: Number(p.size), mtime: Number(p.mtime), content: p.content as string | undefined, sha256: p.sha256 as string | undefined });
      if (r.type === 'vfs.deleted') out.delete(String(p.path));
    }
  }
  return [...out.values()].sort((a, b) => (a.path < b.path ? -1 : 1));
}

/** Reassemble a blob from its chunk events; `undefined` until every chunk is present (C8). */
export async function foldBlob(log: Log, sha256: string): Promise<Uint8Array | undefined> {
  const rows = await log.readAggregate(`${AGGREGATE_PREFIX.blob}${sha256}`);
  const chunks = new Map<number, Uint8Array>();
  let n = 0;
  for (const r of rows) {
    if (r.type !== 'blob.chunk') continue;
    const p = r.payload as { i: number; n: number; bytes: Uint8Array };
    n = p.n;
    chunks.set(p.i, p.bytes);
  }
  if (!n || chunks.size !== n) return undefined;
  const total = [...chunks.values()].reduce((s, c) => s + c.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (let i = 0; i < n; i++) {
    const c = chunks.get(i);
    if (!c) return undefined;
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}
