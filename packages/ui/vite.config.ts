import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

const SRC_DIR = resolve(__dirname, 'src');

export default defineConfig({
  plugins: [dts({ insertTypesEntry: true, rollupTypes: false })],
  build: {
    lib: {
      // Sortable tabs are a separate entry so the root never imports the optional @dnd-kit peers.
      entry: [
        resolve(__dirname, 'src/index.ts'),
        // Lean tabs subpath: consumers that only need tabs skip the chat/HeroUI families.
        resolve(__dirname, 'src/components/tabs/index.ts'),
        resolve(__dirname, 'src/components/tabs/Sortable.tsx'),
        resolve(__dirname, 'src/components/button-group/index.ts'),
        resolve(__dirname, 'src/components/theme-toggle/index.ts'),
      ],
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      // Externalize every non-relative + non-package-internal id. Anything
      // not under packages/ui/src/ is a dependency (peer or runtime) the
      // consumer's bundler resolves. Without this rule Vite was inlining
      // clsx / tailwind-merge / culori / usehooks-ts / react-markdown /
      // react-syntax-highlighter / remark-gfm / mdast-* / micromark-* /
      // unist-* into dist/node_modules/.pnpm/... — caused React duplicate
      // instances + 1.4 MB tarball + broken sourcemap paths.
      external: (id) => {
        // Relative imports stay inlined (own source).
        if (id.startsWith('.')) return false;
        // Absolute paths that point inside our own src/ stay inlined.
        if (resolve(id).startsWith(SRC_DIR)) return false;
        // Everything else is external (declared in package.json deps/peerDeps).
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
