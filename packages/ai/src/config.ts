import * as v from 'valibot';

/**
 * Config SSoT (plan C9, C16). `parseConfig` is pure: it takes an env record and never reads
 * `process.env` or files, so the same schema validates a Merlyn build (VITE_ twins interpolated from
 * `.env`), a Next.js server and the gateway CLI (which loads the file named by `--env`).
 * A missing key fails with the key AND the source named, which is the whole point.
 */

const Url = v.pipe(v.string(), v.url());
const Port = v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(1), v.maxValue(65535));
const Secret = v.pipe(v.string(), v.minLength(16, 'ABMEX_AI_SECRET must be at least 16 characters'));

export const clientConfigSchema = v.object({
  ABMEX_AI_GATEWAY_URL: Url,
  ABMEX_AI_SECRET: Secret,
});
export type ClientConfig = v.InferOutput<typeof clientConfigSchema>;

export const gatewayConfigSchema = v.object({
  ABMEX_AI_STORE: v.optional(v.picklist(['sqlite', 'postgres']), 'sqlite'),
  ABMEX_AI_DATA_DIR: v.pipe(v.string(), v.minLength(1)),
  ABMEX_AI_GATEWAY_HOST: v.optional(v.string(), '127.0.0.1'),
  ABMEX_AI_GATEWAY_PORT: Port,
  ABMEX_AI_SECRET: Secret,
  ABMEX_AI_UPSTREAM_URL: v.optional(Url),
  ABMEX_AI_UPSTREAM_SECRET: v.optional(Secret),
  DATABASE_URL: v.optional(v.string()),
});
export type GatewayConfig = v.InferOutput<typeof gatewayConfigSchema>;

export class ConfigError extends Error {
  readonly missing: readonly string[];
  readonly invalid: readonly string[];
  readonly source: string;
  constructor(source: string, missing: string[], invalid: string[]) {
    const parts = [];
    if (missing.length) parts.push(`missing: ${missing.join(', ')}`);
    if (invalid.length) parts.push(`invalid: ${invalid.join('; ')}`);
    super(`config (${source}): ${parts.join(' | ')}`);
    this.name = 'ConfigError';
    this.missing = missing;
    this.invalid = invalid;
    this.source = source;
  }
}

/**
 * @param schema   `clientConfigSchema` or `gatewayConfigSchema`
 * @param env      a plain record (e.g. `import.meta.env`, `process.env`, a parsed `.env`)
 * @param source   where `env` came from, named in the error (e.g. `.env`, `.env.upstream`, `import.meta.env`)
 * @param prefix   optional key prefix to strip first, e.g. `VITE_` so `VITE_ABMEX_AI_SECRET` satisfies `ABMEX_AI_SECRET`
 */
export function parseConfig<S extends v.GenericSchema>(
  schema: S,
  env: Record<string, string | undefined>,
  source: string,
  prefix = '',
): v.InferOutput<S> {
  const input: Record<string, string> = {};
  for (const [k, val] of Object.entries(env)) {
    if (val === undefined || val === '') continue;
    const key = prefix && k.startsWith(prefix) ? k.slice(prefix.length) : k;
    if (!(key in input)) input[key] = val;
  }
  const r = v.safeParse(schema, input);
  if (r.success) return r.output;
  const missing: string[] = [];
  const invalid: string[] = [];
  for (const issue of r.issues) {
    const key = issue.path?.map((p) => String(p.key)).join('.') ?? '?';
    if (issue.received === 'undefined') missing.push(key);
    else invalid.push(`${key}: ${issue.message}`);
  }
  throw new ConfigError(source, missing, invalid);
}
