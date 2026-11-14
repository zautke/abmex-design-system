# @abmex/ai

Durable persistence for AI chat clients: a per-origin append-only event log, folded on read, replicated one-way to a WAL-acked local gateway and optionally forwarded upstream.

Design: ADR-008 (kb `projects/merlyn/adr/adr-008-…`), plan `projects/merlyn/plans/merlyn-persistence-tabula-rasa-plan-v1-2026-10-20`.

| Entry | Runtime | What |
|---|---|---|
| `@abmex/ai` | any | event catalogue (valibot), `makeEvent`/`validateEvent`, canonical hashing, config schemas + `parseConfig`, `TurnFolder`/`foldTurn` (pure stream → events) |
| `@abmex/ai/client` | browser | IndexedDB log (`idb`, strict durability), fold-on-read, `subscribe`, `sweepInterrupted`, `push` to the gateway — step S2 |
| `@abmex/ai/react` | browser + React 19 | `useConversation`, `useKv`, `usePending` — step S2 |
| `@abmex/ai/gateway` | Node ≥ 22 | Hono `/v1/events`, `/v1/digest`, `/v1/health`; SQLite (better-sqlite3) and Postgres stores; upstream forwarder; CLI — step S2 |

Semantics in one line: an event is **pending** once its strict IndexedDB transaction commits and **saved** once the gateway appends it to its fsynced WAL and acks `(origin, seq)`. The UI never blocks or reverts.
