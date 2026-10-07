import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: [
      { find: /^@abmex\/themes$/, replacement: local('./packages/themes/src/index.ts') },
      { find: /^@abmex\/ui$/, replacement: local('./packages/ui/src/index.ts') },
      { find: /^@abmex\/ui\/components\/(.*)$/, replacement: local('./packages/ui/src/components/$1') },
      { find: /^@abmex\/ui\/tabs$/, replacement: local('./packages/ui/src/components/tabs/index.ts') },
      { find: /^@abmex\/ui\/theme-toggle$/, replacement: local('./packages/ui/src/components/theme-toggle/index.ts') },
      { find: '@', replacement: local('./') },
    ],
  },
  test: {
    maxWorkers: 2,
    include: ['tests/**/*.test.{ts,tsx}', 'packages/*/tests/**/*.test.{ts,tsx}'],
  },
});
