// @vitest-environment node
import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { ConversationCreated, MessageAppended, TurnStarted, aggregateFor, makeEvent } from '../src/index.js';
import { createClient, foldConversation, foldConversationList, sweepInterrupted } from '../src/client/index.js';
import { createApp, createSqliteStore } from '../src/gateway/index.js';

const SECRET = 'test-secret-test-secret';

async function harness(name: string) {
  const store = await createSqliteStore({ file: ':memory:' });
  const app = createApp({ store, secret: SECRET, log: () => undefined });
  const fetchImpl = ((input: RequestInfo | URL, init?: RequestInit) => Promise.resolve(app.request(String(input).replace(/^http:\/\/gw/, ''), init))) as typeof fetch;
  const client = await createClient({ name, gatewayUrl: 'http://gw', secret: SECRET, ctx: 'test', fetch: fetchImpl });
  return { store, app, client };
}

describe('client ⇄ gateway', () => {
  it('append = strict IDB tx (pending), push = gateway ack (saved), verify digests match', async () => {
    const { client, store } = await harness('t1');
    const conv = aggregateFor.conversation('c1');
    const r = await client.append(
      [
        makeEvent(ConversationCreated, conv, { conversationId: 'c1', title: 'First' }, 1),
        makeEvent(MessageAppended, conv, { conversationId: 'c1', messageId: 'm1', role: 'user', text: 'hello' }, 2),
      ],
      { push: false },
    );
    expect(r).toEqual({ firstSeq: 1, lastSeq: 2 });
    expect(await client.pendingCount()).toBe(2);
    const p = await client.push();
    expect(p).toMatchObject({ pushed: 2, batches: 1, ackedSeq: 2 });
    expect(await client.pendingCount()).toBe(0);
    expect(await store.maxSeq(await client.origin())).toBe(2);
    // duplicate delivery is harmless
    await client.log.setMeta('ackedSeq', 0);
    (await client.log.meta()).ackedSeq = 0;
    expect(await client.push()).toMatchObject({ pushed: 2, ackedSeq: 2 });
    const v = await client.verify();
    expect(v).toMatchObject({ ok: true, mismatched: [], pending: 0 });
    const view = await foldConversation(client.log, 'c1');
    expect(view.title).toBe('First');
    expect(view.messages.map((m) => m.text)).toEqual(['hello']);
    expect(await foldConversationList(client.log)).toMatchObject([{ conversationId: 'c1', title: 'First' }]);
    client.close();
  });

  it('a wiped DB becomes a new origin; the old origin stays intact on the gateway', async () => {
    const { client, store } = await harness('t2');
    const conv = aggregateFor.conversation('c1');
    await client.append([makeEvent(ConversationCreated, conv, { conversationId: 'c1', title: 'A' }, 1)], { push: false });
    await client.push();
    const origin1 = await client.origin();
    client.close();
    const { Log } = await import('../src/client/index.js');
    await Log.destroy('t2');
    const { createClient: cc } = await import('../src/client/index.js');
    const app2 = createApp({ store, secret: SECRET, log: () => undefined });
    const fetch2 = ((i: RequestInfo | URL, init?: RequestInit) => Promise.resolve(app2.request(String(i).replace(/^http:\/\/gw/, ''), init))) as typeof fetch;
    const client2 = await cc({ name: 't2', gatewayUrl: 'http://gw', secret: SECRET, ctx: 'test', fetch: fetch2 });
    await client2.append([makeEvent(ConversationCreated, conv, { conversationId: 'c9', title: 'B' }, 1)], { push: false });
    const origin2 = await client2.origin();
    expect(origin2).not.toBe(origin1);
    await client2.push();
    expect(await store.maxSeq(origin1)).toBe(1);
    expect(await store.maxSeq(origin2)).toBe(1);
    client2.close();
  });

  it('sweepInterrupted closes an open turn (no lock held in node) and never a finished one', async () => {
    const { client } = await harness('t3');
    const conv = aggregateFor.conversation('c1');
    await client.append(
      [
        makeEvent(ConversationCreated, conv, { conversationId: 'c1', title: 'A' }, 1),
        makeEvent(MessageAppended, conv, { conversationId: 'c1', messageId: 'a1', role: 'assistant', turnId: 't1' }, 2),
        makeEvent(TurnStarted, conv, { conversationId: 'c1', turnId: 't1', userMessageId: 'u1', assistantMessageId: 'a1', model: { provider: 'ollama', model: 'x' } }, 3),
      ],
      { push: false },
    );
    const s = await sweepInterrupted(client.log, 'c1', 10);
    expect(s.closed).toEqual(['t1']);
    const view = await foldConversation(client.log, 'c1');
    expect(view.turns.t1?.status).toBe('interrupted');
    expect(view.messages.find((m) => m.messageId === 'a1')?.status).toBe('interrupted');
    expect(await sweepInterrupted(client.log, 'c1', 11)).toEqual({ closed: [], skippedHeld: [] });
    client.close();
  });
});
