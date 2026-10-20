'use client';
import { useEffect, useState } from 'react';
import type { Client } from '../client/client.js';
import { emptyConversation, foldConversationFrom, foldConversationList, foldKv, type ConversationSummary, type ConversationView, type KvView } from '../client/fold.js';
import { AGGREGATE_PREFIX } from '../events.js';

/** One conversation, folded incrementally on every broadcast for its aggregate (plan C14). */
export function useConversation(client: Client | undefined, conversationId: string | undefined): ConversationView | undefined {
  const [view, setView] = useState<ConversationView>();
  useEffect(() => {
    if (!client || !conversationId) return setView(undefined);
    let cur = emptyConversation(conversationId);
    let alive = true;
    const refold = async () => {
      cur = await foldConversationFrom(client.log, cur);
      if (alive) setView({ ...cur });
    };
    void refold();
    const off = client.subscribe((c) => {
      if (c.kind === 'append' && c.aggregate === `${AGGREGATE_PREFIX.conversation}${conversationId}`) void refold();
    });
    return () => {
      alive = false;
      off();
    };
  }, [client, conversationId]);
  return view;
}

export function useConversationList(client: Client | undefined): ConversationSummary[] {
  const [list, setList] = useState<ConversationSummary[]>([]);
  useEffect(() => {
    if (!client) return;
    let alive = true;
    const refold = async () => {
      const l = await foldConversationList(client.log);
      if (alive) setList(l);
    };
    void refold();
    const off = client.subscribe((c) => {
      if (c.kind === 'append' && c.aggregate.startsWith(AGGREGATE_PREFIX.conversation)) void refold();
    });
    return () => {
      alive = false;
      off();
    };
  }, [client]);
  return list;
}

/** The `app` aggregate as a key/value view. */
export function useKv(client: Client | undefined): KvView {
  const [kv, setKv] = useState<KvView>({ values: {}, throughSeq: 0 });
  useEffect(() => {
    if (!client) return;
    let cur: KvView = { values: {}, throughSeq: 0 };
    let alive = true;
    const refold = async () => {
      cur = await foldKv(client.log, cur);
      if (alive) setKv({ values: { ...cur.values }, throughSeq: cur.throughSeq });
    };
    void refold();
    const off = client.subscribe((c) => {
      if (c.kind === 'append' && c.aggregate === AGGREGATE_PREFIX.app) void refold();
    });
    return () => {
      alive = false;
      off();
    };
  }, [client]);
  return kv;
}

/** Honest pending count (plan C1): events not yet acked by the gateway, plus the diverged flag. */
export function usePending(client: Client | undefined, aggregate?: string): { pending: number; diverged: boolean } {
  const [state, setState] = useState({ pending: 0, diverged: false });
  useEffect(() => {
    if (!client) return;
    let alive = true;
    const refresh = async () => {
      const [pending, meta] = await Promise.all([client.pendingCount(aggregate), client.log.meta()]);
      if (alive) setState({ pending, diverged: Boolean(meta.diverged) });
    };
    void refresh();
    const off = client.subscribe(() => void refresh());
    return () => {
      alive = false;
      off();
    };
  }, [client, aggregate]);
  return state;
}
