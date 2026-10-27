#!/usr/bin/env node
import { cp } from 'node:fs/promises';

function Usage() {
  console.log('Usage: copy-styles.mjs [-h|--help]');
}
const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) {
  Usage();
  process.exit(0);
}
if (args.length) {
  Usage();
  process.exit(2);
}
const filter = (source) => !/[\\/]build([\\/]|$)/.test(source);
for (const family of ['phosphor', 'cev']) {
  await cp(`src/${family}`, `dist/${family}`, { recursive: true, filter });
}
