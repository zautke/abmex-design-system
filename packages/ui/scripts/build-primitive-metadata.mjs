#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { primitiveDescriptors, primitiveConfigurationSchema } from '../dist/primitives/foundation/descriptors.js';

function Usage() { console.log('Usage: build-primitive-metadata.mjs [-h|--help]'); }
const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) { Usage(); process.exit(0); }
if (args.length) { Usage(); process.exit(2); }
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const contract = await readFile(new URL('../../../docs/continuity/BASE_COMPONENT_CONTRACT.md', import.meta.url), 'utf8');
const contractRevision = /^Revision: ([\d.]+)/m.exec(contract)?.[1];
if (!contractRevision) throw new Error('Contract revision missing');
const identity = { schemaVersion: 1, packageName: pkg.name, packageVersion: pkg.version, contractRevision };
await writeFile(new URL('../dist/primitive-manifest.json', import.meta.url), JSON.stringify({ ...identity, components: primitiveDescriptors }, null, 2) + '\n');
await writeFile(new URL('../dist/primitive-options.schema.json', import.meta.url), JSON.stringify({ ...primitiveConfigurationSchema, 'x-abmex': identity }, null, 2) + '\n');
