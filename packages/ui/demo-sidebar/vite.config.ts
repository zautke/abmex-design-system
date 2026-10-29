import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const envDirectory = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDirectory, '');
  if (!env.APP_HOST || !env.APP_PORT) throw new Error('Set APP_HOST and APP_PORT in demo-sidebar/.env');
  return {
    root: envDirectory,
    server: {
      host: env.APP_HOST,
      port: Number(env.APP_PORT),
      strictPort: true,
    },
    preview: { host: env.APP_HOST, port: Number(env.APP_PORT), strictPort: true },
    esbuild: { jsx: 'automatic' },
  };
});
