// The shebang is added by vite.config.ts (output.banner) so it lands exactly once on line 1.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseDotenv } from 'dotenv';
import { expand } from 'dotenv-expand';
import { ConfigError, gatewayConfigSchema, parseConfig } from '../config.js';
import { startGateway } from './serve.js';

function usage(): void {
  console.log(`Usage: abmex-ai-gateway [options]

  -e, --env <file>        env file(s) to load, comma-separated, later wins (default: .env,.env.local)
  -h, --help              show this help

The gateway reads ABMEX_AI_* keys (see gatewayConfigSchema) from the env files merged over process.env,
with \${VAR} expansion. A missing or invalid key exits 2 naming the key and the file.`);
}

function parseArgs(argv: string[]): { env: string[] } {
  const out = { env: ['.env', '.env.local'] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '-h' || a === '--help') {
      usage();
      process.exit(0);
    } else if (a === '-e' || a === '--env') {
      const v = argv[++i];
      if (!v) throw new Error('--env needs a value');
      out.env = v.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (a.startsWith('--env=')) out.env = a.slice(6).split(',').map((s) => s.trim()).filter(Boolean);
    else throw new Error(`unknown argument ${a} (try --help)`);
  }
  return out;
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);
  const merged: Record<string, string> = {};
  const loaded: string[] = [];
  for (const f of args.env) {
    try {
      Object.assign(merged, parseDotenv(readFileSync(resolve(f), 'utf8')));
      loaded.push(f);
    } catch {
      // optional file
    }
  }
  const expanded = expand({ parsed: { ...merged }, processEnv: { ...process.env } as Record<string, string> }).parsed ?? merged;
  const env = { ...expanded, ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith('ABMEX_AI_') || k === 'DATABASE_URL')) };
  let cfg;
  try {
    cfg = parseConfig(gatewayConfigSchema, env, loaded.join(' + ') || 'process.env');
  } catch (e) {
    if (e instanceof ConfigError) {
      console.error(`[abmex-ai gateway] FATAL ${e.message}`);
      process.exit(2);
    }
    throw e;
  }
  const handle = await startGateway(cfg);
  const stop = async () => {
    await handle.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void stop());
  process.on('SIGTERM', () => void stop());
}

const isEntry = typeof process !== 'undefined' && process.argv[1] && /cli\.(js|ts|mjs)$/.test(process.argv[1]);
if (isEntry) void main().catch((e) => { console.error('[abmex-ai gateway] FATAL', e); process.exit(1); });
