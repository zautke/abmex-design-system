import { AGGREGATE_PREFIX, PartState, TurnInterrupted, makeEvent, type EventEnvelope } from '../events.js';
import { foldConversation } from './fold.js';
import type { Log } from './log.js';

export const turnLockName = (turnId: string): string => `abmex-ai:turn:${turnId}`;

/**
 * Hold the turn lock for the whole turn (plan C13). Acquire it BEFORE appending `turn.started`;
 * the sweep can then never close a running turn.
 */
export function withTurnLock<T>(turnId: string, run: () => Promise<T>): Promise<T> {
  if (typeof navigator === 'undefined' || !navigator.locks) return run();
  return navigator.locks.request(turnLockName(turnId), run) as Promise<T>;
}

export interface SweepResult {
  closed: string[];
  skippedHeld: string[];
}

/**
 * Close every turn that never reached a terminal event and whose lock is free. Check-and-act is
 * atomic under `{ ifAvailable: true }` (review N1): a running turn's lock is held, so it is skipped.
 * Open tool calls get a synthetic error so the model never sees an orphaned tool call.
 */
export async function sweepInterrupted(log: Log, conversationId: string, now = Date.now()): Promise<SweepResult> {
  const view = await foldConversation(log, conversationId);
  const result: SweepResult = { closed: [], skippedHeld: [] };
  for (const turn of Object.values(view.turns)) {
    if (turn.status !== 'open') continue;
    const events: EventEnvelope[] = [];
    const aggregate = `${AGGREGATE_PREFIX.conversation}${conversationId}`;
    const m = view.messages.find((x) => x.messageId === turn.assistantMessageId);
    for (const part of m?.parts ?? []) {
      if (part.kind !== 'tool' || part.state === 'output-available' || part.state === 'output-error' || part.state === 'interrupted') continue;
      events.push(
        makeEvent(PartState, aggregate, { conversationId, messageId: turn.assistantMessageId, partId: part.partId, state: 'interrupted', errorText: 'interrupted: the turn did not finish' }, now),
      );
    }
    events.push(makeEvent(TurnInterrupted, aggregate, { conversationId, turnId: turn.turnId }, now));
    const closed = await (typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request(turnLockName(turn.turnId), { ifAvailable: true }, async (lock) => {
          if (!lock) return false;
          await log.append(events);
          return true;
        })
      : log.append(events).then(() => true));
    (closed ? result.closed : result.skippedHeld).push(turn.turnId);
  }
  return result;
}
