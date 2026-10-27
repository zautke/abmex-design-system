import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const stylesheet = resolve('packages/ui/dist/styles.css');
test('component families have explicit, built JavaScript and type exports', async () => {
  const manifest = JSON.parse(await readFile('packages/ui/package.json', 'utf8'));
  for (const family of ['chat', 'composer', 'conversations', 'settings', 'status', 'theme']) {
    const entry = manifest.exports[`./components/${family}`];
    assert.ok(entry, `Missing public ${family} entry`);
    await access(resolve('packages/ui', entry.import));
    await access(resolve('packages/ui', entry.types));
  }
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
