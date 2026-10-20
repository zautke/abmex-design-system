// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createApp, createSqliteStore, DivergedError } from '../src/gateway/index.js';
import { canonical, sha256Hex } from '../src/hash.js';

async function wire(seq: number, aggregate: string, type: string, payload: unknown, ts = 1000 + seq) {
  const e = { seq, aggregate, type, v: 1, ts, payload };
  return { ...e, hash: await sha256Hex(canonical({ aggregate, type, v: 1, ts, payload })) };
}

describe('sqlite store', () => {
  it('append is one tx, idempotent by (origin, seq), ack = batch max, diverged on a different hash', async () => {
    const store = await createSqliteStore({ file: ':memory:' });
    const a = await wire(1, 'conv:1', 'conversation.created', { conversationId: '1', title: 'x' });
    const b = await wire(2, 'conv:1', 'message.appended', { conversationId: '1', messageId: 'm1', role: 'user', text: 'hi' });
    expect(await store.append('o1', [a, b])).toEqual({ ackedSeq: 2, inserted: 2, duplicates: 0 });
    expect(await store.append('o1', [a, b])).toEqual({ ackedSeq: 2, inserted: 0, duplicates: 2 });
    const b2 = await wire(2, 'conv:1', 'message.appended', { conversationId: '1', messageId: 'm1', role: 'user', text: 'CHANGED' });
    await expect(store.append('o1', [b2])).rejects.toBeInstanceOf(DivergedError);
    expect(await store.maxSeq('o1')).toBe(2);
    expect(await store.readAfter('o1', 1, 10)).toHaveLength(1);
    const d = await store.digest('o1', 2);
    expect(d).toEqual([{ aggregate: 'conv:1', count: 2, maxSeq: 2, sha256: await sha256Hex(a.hash + b.hash) }]);
    expect((await store.health()).durability).toMatchObject({ journal_mode: 'memory', synchronous: 2 });
    await store.setCursor('upstream', 'o1', 2);
    expect(await store.getCursor('upstream', 'o1')).toBe(2);
    await store.close();
  });
});

describe('gateway app', () => {
  it('authenticates, validates hashes, acks the batch max, 409s on divergence, serves digest + health', async () => {
    const store = await createSqliteStore({ file: ':memory:' });
    const app = createApp({ store, secret: 's3cret-s3cret-s3cret', log: () => undefined });
    const a = await wire(1, 'app', 'kv.set', { key: 'k', value: 1 });
    const post = (body: unknown, auth = 'Bearer s3cret-s3cret-s3cret') =>
      app.request('/v1/events', { method: 'POST', headers: { 'content-type': 'application/json', authorization: auth, 'x-abmex-ctx': 'test' }, body: JSON.stringify(body) });
    expect((await post({ origin: 'o', events: [a] }, 'Bearer wrong')).status).toBe(401);
    const ok = await post({ origin: 'o', events: [a] });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ origin: 'o', ackedSeq: 1, inserted: 1 });
    expect((await post({ origin: 'o', events: [{ ...a, hash: 'f'.repeat(64) }] })).status).toBe(400);
    const changed = await wire(1, 'app', 'kv.set', { key: 'k', value: 2 });
    const div = await post({ origin: 'o', events: [changed] });
    expect(div.status).toBe(409);
    expect(await div.json()).toMatchObject({ error: 'diverged', seq: 1 });
    const digest = await app.request('/v1/digest?origin=o&upTo=1', { headers: { authorization: 'Bearer s3cret-s3cret-s3cret' } });
    expect((await digest.json()).digests).toEqual([{ aggregate: 'app', count: 1, maxSeq: 1, sha256: await sha256Hex(a.hash) }]);
    const health = await (await app.request('/v1/health', { headers: { authorization: 'Bearer s3cret-s3cret-s3cret' } })).json();
    expect(health).toMatchObject({ status: 'ok', store: 'sqlite', diverged: ['o'], logBytes: { band: 'ok' } });
    await store.close();
  });
});
