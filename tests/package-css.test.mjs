import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const stylesheet = resolve('packages/ui/dist/styles.css');
const packageRoot = resolve('packages/ui');
test('component families have explicit, built JavaScript and type exports', async () => {
  const manifest = JSON.parse(await readFile('packages/ui/package.json', 'utf8'));
  for (const family of ['chat', 'composer', 'conversations', 'settings', 'status', 'theme']) {
    const entry = manifest.exports[`./components/${family}`];
    assert.ok(entry, `Missing public ${family} entry`);
    await access(resolve('packages/ui', entry.import));
    await access(resolve('packages/ui', entry.types));
  }
});

test('primitive metadata and declarations match the public package identity', async () => {
  const manifest = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8'));
  assert.ok(manifest.files.includes('dist'), 'The published package must include built artifacts');
  const contract = await readFile('docs/continuity/BASE_COMPONENT_CONTRACT.md', 'utf8');
  const contractRevision = /^Revision: ([\d.]+)/m.exec(contract)?.[1];
  assert.ok(contractRevision, 'Missing base component contract revision');

  const publicFiles = {
    manifest: manifest.exports['./primitive-manifest.json'],
    schema: manifest.exports['./primitive-options.schema.json'],
    styles: manifest.exports['./styles.css'],
  };
  for (const path of Object.values(publicFiles)) await access(resolve(packageRoot, path));

  const metadata = JSON.parse(await readFile(resolve(packageRoot, publicFiles.manifest), 'utf8'));
  const schema = JSON.parse(await readFile(resolve(packageRoot, publicFiles.schema), 'utf8'));
  const identity = {
    schemaVersion: 1,
    packageName: manifest.name,
    packageVersion: manifest.version,
    contractRevision,
  };
  assert.deepEqual({
    schemaVersion: metadata.schemaVersion,
    packageName: metadata.packageName,
    packageVersion: metadata.packageVersion,
    contractRevision: metadata.contractRevision,
  }, identity);
  assert.deepEqual(schema['x-abmex'], identity);
  assert.deepEqual(metadata.components.map(component => component.name), [
    'Text', 'Icon', 'Button', 'IconButton', 'BaseLayoutContainer', 'LayoutContainer',
  ]);
  assert.deepEqual(schema.oneOf.map(item => item.properties.component.const), metadata.components.map(component => component.name));

  const declarations = await readFile(resolve(packageRoot, manifest.types.replace('./', '')), 'utf8');
  for (const name of ['Text', 'Icon', 'Button', 'IconButton', 'BaseLayoutContainer', 'LayoutContainer']) {
    assert.match(declarations, new RegExp(`\\b${name}\\b`), `Missing ${name} from public declarations`);
  }
  assert.ok(manifest.sideEffects.includes('**/*.css'), 'CSS must remain marked as a package side effect');
});

test('shipped CSS works without a consumer Tailwind compiler', async () => {
  const css = await readFile(stylesheet, 'utf8');
  assert.doesNotMatch(css, /@(import|source|theme|utility|apply|custom-variant)\b/);
  assert.match(css, /\.flex\s*\{/);
  assert.match(css, /\.theme-transitioning/);
  for (const [, url] of css.matchAll(/url\(["']?([^\s)'"\n]+)["']?\)/g)) {
    if (!url.startsWith('data:')) await access(resolve(dirname(stylesheet), url));
  }
});

test('themes ships the cev family and the MUI adapter', async () => {
  const manifest = JSON.parse(await readFile('packages/themes/package.json', 'utf8'));
  await access(resolve('packages/themes', manifest.exports['./mui'].import));
  await access(resolve('packages/themes', manifest.exports['./mui'].types));
  const css = await readFile(resolve('packages/themes/dist/cev/cev.tokens.css'), 'utf8');
  assert.match(css, /\[data-theme="cev"\]\[data-mode="light"\]/);
  await assert.rejects(access(resolve('packages/themes/dist/cev/build')));
});

test('Tailwind compiles the phosphor bridge with the cev overlay; dark:/light: follow data-mode', async () => {
  const { compile } = await import('tailwindcss');
  const themes = resolve('packages/themes/dist');
  const loadStylesheet = async (id, base) => {
    const path = id === 'tailwindcss' ? resolve('node_modules/tailwindcss/index.css') : resolve(base, id);
    return { path, base: dirname(path), content: await readFile(path, 'utf8') };
  };
  const input = '@import "tailwindcss";\n@import "./phosphor/phosphor.tailwind.css";\n@import "./cev/cev.tokens.css";';
  const { build } = await compile(input, { base: themes, loadStylesheet });
  const css = build(['bg-primary', 'rounded-base', 'dark:hidden', 'light:hidden']);
  assert.match(css, /\.bg-primary\s*\{[^}]*var\(--primary\)/);
  assert.match(css, /\.rounded-base\s*\{[^}]*var\(--radius\)/);
  assert.match(css, /\[data-theme="cev"\] \[data-mode="light"\]/); // nested scope re-resolves
  // Mode scopes are the token selectors: data-mode outranks .dark/.light and legacy data-theme.
  for (const variant of ['dark', 'light']) {
    const rule = css.split(`.${variant}\\:hidden`)[1]?.split('display: none')[0];
    assert.ok(rule, `missing ${variant}:hidden`);
    for (const scope of ['[data-mode="dark"]', '[data-mode="light"]', '.dark:not([data-mode])']) assert.ok(rule.includes(scope), `${variant}: ${scope}`);
  }
});
