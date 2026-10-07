#!/usr/bin/env node
import { build } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

function Usage() { console.log('Usage: build-css.mjs [-h|--help]'); }
const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) { Usage(); process.exit(0); }
if (args.length) { Usage(); process.exit(2); }
await build({
  configFile: false,
  base: './',
  root: fileURLToPath(new URL('../', import.meta.url)),
  plugins: [tailwindcss()],
  build: {
    emptyOutDir: false,
    cssMinify: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: fileURLToPath(new URL('../src/styles/compiled.css', import.meta.url)),
      output: { assetFileNames: asset => asset.names?.some(name => name.endsWith('.css')) ? 'styles.css' : 'assets/[name]-[hash][extname]' },
    },
  },
});
