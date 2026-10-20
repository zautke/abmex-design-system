import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

const SRC_DIR = resolve(__dirname, 'src');

// Same shape as packages/ui: ESM only, every non-relative id external, modules preserved so
// each subpath entry stays a lean import. Entries grow with the steps of the persistence plan
// (S1: root; S2: client, react, gateway).
export default defineConfig({
  plugins: [dts({ insertTypesEntry: true, rollupTypes: false, include: ['src'] })],
  build: {
    lib: {
      entry: [resolve(__dirname, 'src/index.ts')],
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
      },
    },
    sourcemap: true,
    target: 'es2022',
    minify: false,
    emptyOutDir: true,
  },
});
