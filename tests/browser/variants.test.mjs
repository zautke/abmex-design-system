#!/usr/bin/env node
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { compile } from 'tailwindcss';
import { chromium } from '@playwright/test';

function Usage() { console.log('Usage: node tests/browser/variants.test.mjs [-h|--help]'); }
const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) { Usage(); process.exit(0); }
if (args.length) { Usage(); process.exit(2); }

test('dark:/light: fire for the nearest mode scope, the one the tokens resolve from', async () => {
  const loadStylesheet = async (id, base) => {
    const path = id === 'tailwindcss' ? resolve('node_modules/tailwindcss/index.css') : resolve(base, id);
    return { path, base: dirname(path), content: await readFile(path, 'utf8') };
  };
  const { build } = await compile('@import "tailwindcss";\n@import "./phosphor/phosphor.tailwind.css";\n@import "./cev/cev.tokens.css";',
    { base: resolve('packages/themes/dist'), loadStylesheet });
  const css = build(['hidden', 'dark:inline', 'light:inline']);
  // Use installed Chrome by default; never download a browser during the check.
  const browser = await chromium.launch({ channel: process.env.ABMEX_BROWSER_CHANNEL || 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>${css}</style><main></main>`);
    const wrong = await page.evaluate(() => {
      const scopes = ['class="dark"', 'class="light"', 'data-theme="dark"', 'data-theme="cev"', 'data-mode="dark"', 'data-mode="light"', 'class="dark" data-mode="light"', 'class="light" data-mode="dark"', 'class="dark" data-theme="light"', 'class="dark light"'];
      const roots = [{}, { theme: 'cev', mode: 'light' }, { theme: 'cev', mode: 'dark' }, { mode: 'light' }, { className: 'light' }];
      let chains = [[]];
      for (let depth = 0; depth < 3; depth++) chains = chains.concat(chains.filter(c => c.length === depth).flatMap(c => scopes.map(s => [...c, s])));
      document.querySelector('main').innerHTML = chains.map(chain =>
        `${chain.map(s => `<div ${s}>`).join('')}<p data-chain='${chain.join(' > ')}'><span class="hidden dark:inline"></span><span class="hidden light:inline"></span></p>${'</div>'.repeat(chain.length)}`).join('');
      // Reference: the token cascade itself. Every mode block sets color-scheme, so the computed value is the resolved mode.
      const modeOf = el => getComputedStyle(el).colorScheme;
      const wrong = [];
      for (const { theme, mode, className = '' } of roots) {
        const root = document.documentElement;
        root.className = className;
        theme ? root.dataset.theme = theme : delete root.dataset.theme;
        mode ? root.dataset.mode = mode : delete root.dataset.mode;
        for (const p of document.querySelectorAll('p')) {
          const shown = [...p.children].map(span => getComputedStyle(span).display !== 'none');
          const expected = modeOf(p) === 'dark' ? [true, false] : [false, true];
          if (String(shown) !== String(expected)) wrong.push(`${JSON.stringify({ theme, mode, className })} ${p.dataset.chain}: dark=${shown[0]} light=${shown[1]}`);
        }
      }
      return { count: document.querySelectorAll('p').length * roots.length, wrong };
    });
    assert.equal(wrong.count, 1111 * 5);
    assert.deepEqual(wrong.wrong.slice(0, 10), []);
  } finally {
    await browser.close();
  }
});
