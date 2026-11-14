import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

const SRC_DIR = resolve(__dirname, 'src');

// Same shape as packages/ui: ESM only, every non-relative id external, modules preserved so each
// subpath entry stays a lean import. Four public entries (plan C11) plus the gateway CLI binary.
export default defineConfig({
  plugins: [dts({ insertTypesEntry: true, rollupTypes: false, include: ['src'] })],
  build: {
    lib: {
      entry: [
        resolve(__dirname, 'src/index.ts'),
        resolve(__dirname, 'src/client/index.ts'),
        resolve(__dirname, 'src/react/index.ts'),
        resolve(__dirname, 'src/gateway/index.ts'),
        resolve(__dirname, 'src/gateway/cli.ts'),
      ],
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: (id) => {
        if (id.startsWith('.')) return false;
        if (resolve(id).startsWith(SRC_DIR)) return false;
        return true;
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        // The CLI keeps its shebang; the React entry keeps its directive (Vite strips both).
        banner: (chunk) => {
          if (chunk.name === 'gateway/cli') return '#!/usr/bin/env node';
          if (chunk.name === 'react/index') return "'use client';";
          return '';
        },
      },
    },
    sourcemap: true,
    target: 'es2022',
    minify: false,
    emptyOutDir: true,
  },
});
