import type { EventEnvelope } from './events.js';

/**
 * Canonical JSON: keys sorted, no whitespace, `undefined` dropped, byte arrays as base64 with a
 * tag so Node and the browser agree. Used for event hashes and import parity hashes.
 */
export function canonical(value: unknown): string {
  return JSON.stringify(normalize(value));
}

function normalize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Uint8Array) return { $bytes: toBase64(value) };
  if (Array.isArray(value)) return value.map(normalize);
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    const v = (value as Record<string, unknown>)[key];
    if (v !== undefined) out[key] = normalize(v);
  }
  return out;
}

export function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function fromBase64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** sha256 hex via WebCrypto (browser, service worker and Node >= 20 all expose `globalThis.crypto.subtle`). */
export async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data as BufferSource);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Plan C12 (N9): the hash covers aggregate, type, v, ts and payload. */
export function hashEvent(e: EventEnvelope): Promise<string> {
  return sha256Hex(canonical({ aggregate: e.aggregate, type: e.type, v: e.v, ts: e.ts, payload: e.payload }));
}
