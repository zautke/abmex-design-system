import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
const env = loadEnv('development', root, 'ABMEX_DEMO_');
if (!env.ABMEX_DEMO_HOST || !env.ABMEX_DEMO_PORT) throw new Error('Missing demo host/port configuration');
export default defineConfig({ root, esbuild: { jsx: 'automatic' }, server: { host: env.ABMEX_DEMO_HOST, port: Number(env.ABMEX_DEMO_PORT), strictPort: true } });
