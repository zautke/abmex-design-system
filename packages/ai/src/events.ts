import * as v from 'valibot';

/**
 * Event catalogue v1 for the per-origin append-only log (plan C2, C10, C12).
 *
 * Identity of a stored event is `(origin, seq)`; `seq` is minted by the store (IDB autoincrement
 * or the gateway's own counter) and is never part of the payload. `hash` covers
 * `(aggregate, type, v, ts, payload)` and lets the gateway refuse a divergent replay (409).
 * Events are immutable; a shape change is a new `v`, and unknown `type@v` are skipped on read.
 */

export const AGGREGATE_PREFIX = {
  conversation: 'conv:',
  app: 'app',
  theme: 'theme:',
  vfs: 'vfs:',
  blob: 'blob:',
} as const;

export const aggregateFor = {
  conversation: (id: string) => `${AGGREGATE_PREFIX.conversation}${id}`,
  app: () => AGGREGATE_PREFIX.app,
  theme: (id: string) => `${AGGREGATE_PREFIX.theme}${id}`,
  vfs: (path: string) => `${AGGREGATE_PREFIX.vfs}${path}`,
  blob: (sha256: string) => `${AGGREGATE_PREFIX.blob}${sha256}`,
} as const;

const Id = v.pipe(v.string(), v.minLength(1));
const Millis = v.pipe(v.number(), v.integer(), v.minValue(0));

export const UsageSchema = v.object({
  input: Millis,
  output: Millis,
  reasoning: v.optional(Millis),
  cachedRead: v.optional(Millis),
  cachedWrite: v.optional(Millis),
  costUsd: v.optional(v.number()),
  /** Provider payload verbatim; `source` says whether the numbers were reported or estimated. */
  source: v.optional(v.picklist(['reported', 'estimated'])),
  raw: v.optional(v.unknown()),
});
export type Usage = v.InferOutput<typeof UsageSchema>;

export const ModelRefSchema = v.object({ provider: Id, model: Id });
export type ModelRef = v.InferOutput<typeof ModelRefSchema>;

export const ToolStateSchema = v.picklist([
  'input-streaming',
  'input-available',
  'running',
  'output-available',
  'output-error',
  'interrupted',
]);
export type ToolState = v.InferOutput<typeof ToolStateSchema>;

/** One event definition: `type@v` plus its payload schema. */
export interface EventDef<TType extends string, TV extends number, TSchema extends v.GenericSchema> {
  readonly type: TType;
  readonly v: TV;
  readonly payload: TSchema;
}

function def<TType extends string, TV extends number, TSchema extends v.GenericSchema>(
  type: TType,
  version: TV,
  payload: TSchema,
): EventDef<TType, TV, TSchema> {
  return { type, v: version, payload };
}

// --- conversation aggregate -------------------------------------------------------------------

export const ConversationCreated = def('conversation.created', 1, v.object({ conversationId: Id, title: v.string() }));
export const ConversationRenamed = def(
  'conversation.renamed',
  1,
  v.object({ conversationId: Id, title: v.string(), source: v.picklist(['auto', 'manual']) }),
);
export const ConversationDeleted = def('conversation.deleted', 1, v.object({ conversationId: Id }));
export const ConversationCleared = def('conversation.cleared', 1, v.object({ conversationId: Id }));
/** Fold checkpoint written at `turn.finished`; a fold starts from the newest snapshot (plan C14). */
export const ConversationSnapshot = def(
  'conversation.snapshot',
  1,
  v.object({ conversationId: Id, state: v.unknown(), throughSeq: Millis }),
);

export const TurnStarted = def(
  'turn.started',
  1,
  v.object({ conversationId: Id, turnId: Id, userMessageId: Id, assistantMessageId: Id, model: ModelRefSchema }),
);
export const TurnFinished = def(
  'turn.finished',
  1,
  v.object({
    conversationId: Id,
    turnId: Id,
    reason: v.picklist(['stop', 'max-steps', 'doom-loop', 'abort', 'error']),
    usage: v.optional(UsageSchema),
    error: v.optional(v.object({ kind: v.string(), message: v.string() })),
    durationMs: v.optional(Millis),
  }),
);
/** Written by `sweepInterrupted()` for a turn whose lock is free and that never finished. */
export const TurnInterrupted = def('turn.interrupted', 1, v.object({ conversationId: Id, turnId: Id }));

export const MessageAppended = def(
  'message.appended',
  1,
  v.object({
    conversationId: Id,
    messageId: Id,
    turnId: v.optional(Id),
    role: v.picklist(['user', 'assistant', 'system', 'notice']),
    kind: v.optional(v.string()),
    text: v.optional(v.string()),
    images: v.optional(v.array(v.object({ sha256: Id, mime: v.string(), width: v.optional(Millis), height: v.optional(Millis) }))),
  }),
);

export const PartAppended = def(
  'part.appended',
  1,
  v.object({
    conversationId: Id,
    messageId: Id,
    partId: Id,
    kind: v.picklist(['text', 'reasoning', 'tool', 'image']),
    toolCallId: v.optional(Id),
    toolName: v.optional(v.string()),
  }),
);
/** Coalesced text/reasoning delta; `offset` makes a replayed delta idempotent (plan C13). */
export const PartDelta = def(
  'part.delta',
  1,
  v.object({ conversationId: Id, messageId: Id, partId: Id, offset: Millis, text: v.string() }),
);
export const PartState = def(
  'part.state',
  1,
  v.object({
    conversationId: Id,
    messageId: Id,
    partId: Id,
    state: ToolStateSchema,
    input: v.optional(v.unknown()),
    output: v.optional(v.unknown()),
    errorText: v.optional(v.string()),
  }),
);
export const PartExcluded = def('part.excluded', 1, v.object({ conversationId: Id, messageId: Id, partId: Id, excluded: v.boolean() }));

export const UsageRecorded = def('usage.recorded', 1, v.object({ conversationId: Id, turnId: Id, step: Millis, usage: UsageSchema }));

// --- app aggregate (settings, model prefs, provider config, secrets) ---------------------------

export const KvSet = def('kv.set', 1, v.object({ key: Id, value: v.unknown() }));
export const KvDeleted = def('kv.deleted', 1, v.object({ key: Id }));
export const KvSnapshot = def('kv.snapshot', 1, v.object({ state: v.record(v.string(), v.unknown()), throughSeq: Millis }));

// --- theme aggregate -------------------------------------------------------------------------------

export const ThemePut = def('theme.put', 1, v.object({ themeId: Id, theme: v.unknown() }));
export const ThemeDeleted = def('theme.deleted', 1, v.object({ themeId: Id }));

// --- vfs + blob aggregates (plan C8: chunks precede the reference, same strict tx) ---------------

export const VfsPut = def(
  'vfs.put',
  1,
  v.object({
    path: Id,
    mime: v.string(),
    size: Millis,
    mtime: Millis,
    /** Inline for small utf8 content; otherwise `sha256` points at `blob.chunk` events. */
    content: v.optional(v.string()),
    sha256: v.optional(Id),
  }),
);
export const VfsDeleted = def('vfs.deleted', 1, v.object({ path: Id }));
export const BlobChunk = def(
  'blob.chunk',
  1,
  v.object({ sha256: Id, i: Millis, n: v.pipe(v.number(), v.integer(), v.minValue(1)), bytes: v.instance(Uint8Array) }),
);

// --- import ------------------------------------------------------------------------------------------

export const Imported = def(
  'imported.row',
  1,
  v.object({ srcTable: Id, srcKey: Id, row: v.unknown(), srcOrder: v.optional(Millis) }),
);

export const CATALOGUE = [
  ConversationCreated,
  ConversationRenamed,
  ConversationDeleted,
  ConversationCleared,
  ConversationSnapshot,
  TurnStarted,
  TurnFinished,
  TurnInterrupted,
  MessageAppended,
  PartAppended,
  PartDelta,
  PartState,
  PartExcluded,
  UsageRecorded,
  KvSet,
  KvDeleted,
  KvSnapshot,
  ThemePut,
  ThemeDeleted,
  VfsPut,
  VfsDeleted,
  BlobChunk,
  Imported,
] as const;

export type AnyEventDef = (typeof CATALOGUE)[number];
export type EventType = AnyEventDef['type'];

/** `type@v` key used for catalogue lookup and for the gateway's raw storage column. */
export const versionedType = (type: string, version: number): string => `${type}@${version}`;

const byKey = new Map<string, AnyEventDef>(CATALOGUE.map((d) => [versionedType(d.type, d.v), d]));

export function lookupEvent(type: string, version: number): AnyEventDef | undefined {
  return byKey.get(versionedType(type, version));
}

/** The envelope the client appends and the gateway stores; `seq` and `origin` are stamped by the store. */
export const EventEnvelopeSchema = v.object({
  aggregate: Id,
  type: Id,
  v: v.pipe(v.number(), v.integer(), v.minValue(1)),
  ts: Millis,
  payload: v.unknown(),
  /** sha256 hex over canonical(aggregate, type, v, ts, payload); see `hashEvent`. */
  hash: v.optional(v.pipe(v.string(), v.regex(/^[0-9a-f]{64}$/))),
});
export type EventEnvelope = v.InferOutput<typeof EventEnvelopeSchema>;

export interface StoredEvent extends EventEnvelope {
  origin: string;
  seq: number;
  hash: string;
}

export type PayloadOf<D extends AnyEventDef> = v.InferOutput<D['payload']>;

/** Build a validated envelope for a catalogue event. Throws `EventValidationError` on a bad payload. */
export function makeEvent<D extends AnyEventDef>(
  defn: D,
  aggregate: string,
  payload: PayloadOf<D>,
  ts: number = Date.now(),
): EventEnvelope {
  const parsed = v.safeParse(defn.payload, payload);
  if (!parsed.success) throw new EventValidationError(defn.type, defn.v, parsed.issues);
  return { aggregate, type: defn.type, v: defn.v, ts, payload: parsed.output };
}

/** Validate an envelope read back from any store; unknown `type@v` returns `{ known: false }` so cursors still advance. */
export function validateEvent(e: unknown): { known: true; event: EventEnvelope } | { known: false; reason: string } {
  const env = v.safeParse(EventEnvelopeSchema, e);
  if (!env.success) return { known: false, reason: 'envelope: ' + v.summarize(env.issues) };
  const defn = lookupEvent(env.output.type, env.output.v);
  if (!defn) return { known: false, reason: `unknown ${versionedType(env.output.type, env.output.v)}` };
  const payload = v.safeParse(defn.payload, env.output.payload);
  if (!payload.success) return { known: false, reason: `payload ${defn.type}: ` + v.summarize(payload.issues) };
  return { known: true, event: { ...env.output, payload: payload.output } };
}

type Issues = [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]];

export class EventValidationError extends Error {
  readonly issues: Issues;
  constructor(type: string, version: number, issues: Issues) {
    super(`invalid ${versionedType(type, version)} payload: ${v.summarize(issues)}`);
    this.name = 'EventValidationError';
    this.issues = issues;
  }
}
