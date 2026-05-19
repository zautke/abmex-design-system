import { useEffect, useRef, useState } from 'react';
import type { DbConversationItem } from '../types/conversation';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useChatPaneController } from '../hooks/useChatPaneController';
import type { TransportDebugEntry } from '../adapters/transportDebug';

interface Props {
  history: DbConversationItem[];
  showEmptyState?: boolean;
}

function ChatBubble({ item }: { item: Extract<DbConversationItem, { kind: 'chat' }> }) {
  const isUser = item.role === 'user';

  return (
    <li className={`flex w-full min-w-0 flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={[
          'min-w-0 max-w-[85%] overflow-hidden rounded-2xl px-3 py-2 text-sm leading-relaxed [overflow-wrap:anywhere]',
          isUser
            ? 'rounded-br-sm bg-chat-bubble-user-bg text-chat-bubble-user-text'
            : 'rounded-bl-sm border border-chat-bubble-ai-border bg-chat-bubble-ai-bg text-chat-bubble-ai-text',
          item.error ? 'opacity-70' : '',
        ].join(' ')}
      >
        <div className="flex min-w-0 max-w-full flex-col">
          {item.content ? (
            <MarkdownRenderer content={item.content} />
          ) : item.streaming ? (
            ''
          ) : (
            '…'
          )}
          {item.streaming && (
            <span className="ml-0.5 inline-block animate-[blink_1s_step-end_infinite]">▋</span>
          )}
          {item.error && (
            <span className="mt-1 block text-xs text-chat-error-text">{item.error}</span>
          )}
        </div>
      </div>
      {!isUser && <StreamingMetrics item={item} />}
    </li>
  );
}

// Minimum observation window before displaying live TPS — prevents near-zero elapsed
// divisions caused by the interval firing within milliseconds of the first-token ref being set.
const LIVE_TPS_MIN_ELAPSED_S = 0.5;
// Minimum content before estimating tokens — avoids inflated rates from single-token bursts.
const LIVE_TPS_MIN_CHARS = 40;
// Conservative chars-per-token ratio (GPT-4 / Llama averages ~4 chars/token).
const CHARS_PER_TOKEN = 4;

function StreamingMetrics({ item }: { item: Extract<DbConversationItem, { kind: 'chat' }> }) {
  const firstTokenTimeRef = useRef<number | null>(null);
  const contentRef = useRef(item.content);
  const [display, setDisplay] = useState<{ value: number; unit: string; live: boolean } | null>(null);

  contentRef.current = item.content;

  useEffect(() => {
    if (item.content.length > 0 && firstTokenTimeRef.current === null) {
      firstTokenTimeRef.current = Date.now();
    }
  }, [item.content]);

  useEffect(() => {
    if (!item.streaming) return;
    const id = setInterval(() => {
      if (firstTokenTimeRef.current === null) return;
      const elapsed = (Date.now() - firstTokenTimeRef.current) / 1000;
      if (elapsed < LIVE_TPS_MIN_ELAPSED_S) return;
      const content = contentRef.current;
      if (content.length < LIVE_TPS_MIN_CHARS) return;
      const estTokens = content.length / CHARS_PER_TOKEN;
      const tps = estTokens / elapsed;
      setDisplay({ value: tps >= 1 ? tps : tps * 60, unit: tps >= 1 ? 't/s' : 't/m', live: true });
    }, Math.round(1000 / 6));
    return () => clearInterval(id);
  }, [item.streaming]);

  useEffect(() => {
    if (item.streaming || firstTokenTimeRef.current === null) return;
    const tokens = item.usage?.outputTokens ?? Math.round(contentRef.current.length / CHARS_PER_TOKEN);
    const elapsed =
      item.usage?.generationDurationNs != null
        ? item.usage.generationDurationNs / 1_000_000_000
        : (Date.now() - firstTokenTimeRef.current) / 1000;
    if (elapsed < 0.1) return;
    const tps = tokens / elapsed;
    setDisplay({ value: tps >= 1 ? tps : tps * 60, unit: tps >= 1 ? 't/s' : 't/m', live: false });
  }, [item.streaming, item.usage?.outputTokens, item.usage?.generationDurationNs]);

  if (!display) return null;

  return (
    <div className="mt-0.5 flex items-center gap-1.5 px-1 text-xs text-slate-500">
      {display.live && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400 animate-pulse" />
      )}
      <span className="font-bold tabular-nums">{display.value.toFixed(1)}</span>
      <span className="font-medium text-slate-400">{display.unit}</span>
    </div>
  );
}

function ModelInfoRow({ item }: { item: Extract<DbConversationItem, { kind: 'model-info' }> }) {
  return (
    <li className="flex justify-start">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] tracking-[0.16em] text-slate-500">
          {item.modelSnapshot.displayName}
        </span>
        <span className="h-px w-10 bg-slate-200" aria-hidden />
      </div>
    </li>
  );
}

function OOCRow({ item }: { item: Extract<DbConversationItem, { kind: 'ooc' }> }) {
  return (
    <li className="flex justify-center">
      <div className="px-3 py-1 text-xs italic text-[var(--oocm-text)]">
        {item.content}
      </div>
    </li>
  );
}

function JsonRow({ item }: { item: DbConversationItem }) {
  return (
    <li className="flex w-full min-w-0 flex-col">
      <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
        <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">
          <span className="font-mono">{item.kind}</span>
          {item.kind === 'chat' && <span>· {item.role}</span>}
        </div>
        <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words font-mono text-[10px] text-slate-700">
          {JSON.stringify(item.raw ?? item, null, 2)}
        </pre>
      </div>
    </li>
  );
}

function TransportBufferPanel({
  entries,
  onClear,
}: {
  entries: readonly TransportDebugEntry[];
  onClear?: (() => void) | undefined;
}) {
  const tailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [entries.length]);

  return (
    <section className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-[10px]">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-medium uppercase tracking-[0.14em] text-slate-500">
          Transport buffer ({entries.length})
        </span>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] uppercase tracking-[0.14em] text-slate-400 transition hover:text-rose-500"
          >
            Clear buffer
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="text-slate-400">No transport activity yet.</p>
      ) : (
        <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded border border-slate-200 bg-white p-1">
              <div className="mb-0.5 flex items-center gap-2 text-slate-400">
                <span className="tabular-nums">{new Date(entry.ts).toISOString().slice(11, 23)}</span>
                {entry.direction && <span className="font-mono uppercase">{entry.direction}</span>}
                {entry.channel && <span className="font-mono">{entry.channel}</span>}
                {entry.label && <span className="text-slate-500">· {entry.label}</span>}
                {entry.sizeBytes !== undefined && (
                  <span className="ml-auto tabular-nums text-slate-300">{entry.sizeBytes}b</span>
                )}
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[10px] text-slate-700">
                {JSON.stringify(entry.payload, null, 2)}
              </pre>
            </li>
          ))}
          <div ref={tailRef} aria-hidden />
        </ul>
      )}
    </section>
  );
}

export function ChatPane({ history, showEmptyState = true }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLUListElement>(null);
  const userFrozen = useRef(false);
  const [showResume, setShowResume] = useState(false);

  // Controller hook owns JSON-view toggle + TransportDebug adapter consumption.
  // Scroll-anchor refs stay here — they're DOM-bound to this view's JSX.
  const { isJsonFormat, toggleJsonFormat, transportEntries, transportAdapter, clearTransport } =
    useChatPaneController({ history });

  useEffect(() => {
    const lastItem = history[history.length - 1];
    if (lastItem?.kind === 'chat' && lastItem.role === 'user') {
      userFrozen.current = false;
      setShowResume(false);
    }
    if (userFrozen.current) return;
    const behavior: ScrollBehavior =
      lastItem?.kind === 'chat' && lastItem.streaming ? 'instant' : 'smooth';
    bottomRef.current?.scrollIntoView({ behavior });
  }, [history]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    const nowFrozen = !atBottom;
    if (nowFrozen !== userFrozen.current) {
      userFrozen.current = nowFrozen;
      setShowResume(nowFrozen);
    }
  };

  const resumeScroll = () => {
    userFrozen.current = false;
    setShowResume(false);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 max-w-full flex-col bg-transparent">
      <div className="flex items-center justify-end px-3 pt-2">
        <button
          type="button"
          onClick={toggleJsonFormat}
          className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 transition hover:text-slate-600"
        >
          {isJsonFormat ? 'Text view' : 'JSON view'}
        </button>
      </div>

      {history.length === 0 && showEmptyState ? (
        <div className="flex flex-1 items-center justify-center text-sm text-chat-empty-text">
          Send a message to start chatting.
        </div>
      ) : (
        <ul
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex min-w-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden px-3 py-4"
        >
          {history.map((item) => {
            if (isJsonFormat) {
              return <JsonRow key={item.id} item={item} />;
            }
            if (item.kind === 'model-info') return <ModelInfoRow key={item.id} item={item} />;
            if (item.kind === 'ooc') return <OOCRow key={item.id} item={item} />;
            return <ChatBubble key={item.id} item={item} />;
          })}
          <div ref={bottomRef} aria-hidden />
        </ul>
      )}

      {isJsonFormat && transportAdapter && (
        <TransportBufferPanel entries={transportEntries} onClear={clearTransport} />
      )}

      {showResume && (
        <button
          type="button"
          onClick={resumeScroll}
          className="absolute bottom-3 right-3 z-10 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 shadow-sm transition hover:text-slate-800"
        >
          ↓ Resume
        </button>
      )}
    </div>
  );
}
