#!/usr/bin/env node

import { cp, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

function Usage() {
  console.log('Usage: copy-css.mjs [-h|--help]');
  console.log('Writes dist/styles.css (src/styles/tailwind.css with its relative @imports inlined),');
  console.log('dist/fonts/ and the drop-in Phosphor theme layer at dist/phosphor/.');
}

const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) {
  Usage();
  process.exit(0);
}
if (args.length > 0) {
  Usage();
  process.exit(2);
}

const RELATIVE_IMPORT = /^@import\s+['"](\.{1,2}\/[^'"]+)['"];\s*$/gm;

// Inline relative @imports so dist/styles.css is one string: the theme editor
// parses it via `?raw`, which never follows imports. Package imports
// ('tailwindcss') stay as they are for the consumer's bundler.
async function inline(path) {
  const css = await readFile(path, 'utf8');
  let out = '';
  let last = 0;
  for (const match of css.matchAll(RELATIVE_IMPORT)) {
    out += css.slice(last, match.index);
    out += await inline(join(dirname(path), match[1]));
    last = match.index + match[0].length;
  }
  return out + css.slice(last);
}

const flat = await inline('src/styles/tailwind.css');
await writeFile('dist/styles.css', flat.replaceAll("@source '../", "@source './"));
await cp('src/styles/phosphor/fonts', 'dist/fonts', { recursive: true });
await cp('src/styles/phosphor', 'dist/phosphor', {
  recursive: true,
  filter: (src) => !/[\\/]build([\\/]|$)/.test(src),
});
