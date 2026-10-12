// Shared named errors for abmex components (CF-15). Every error carries a
// stable `code` that doubles as the docs lookup key. Thrown in dev AND prod —
// never swallowed, never downgraded to a console warning.
export const ORPHAN_PART = 'ABMEX_ORPHAN_PART' as const;

export class OrphanPartError extends Error {
  readonly code = ORPHAN_PART;
  constructor(readonly component: string, readonly part: string) {
    super(`${component}.${part} must be rendered inside <${component}> (${ORPHAN_PART})`);
    this.name = 'OrphanPartError';
  }
}
