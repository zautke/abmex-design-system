#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';

function Usage() {
  console.log('Usage: copy-css.mjs [-h|--help]');
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

const source = await readFile('src/styles/tailwind.css', 'utf8');
await writeFile('dist/styles.css', source.replaceAll("@source '../", "@source './"));
