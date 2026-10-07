#!/usr/bin/env node
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';

function Usage() { console.log('Usage: node tests/browser/tabs.test.mjs [-h|--help]'); }
const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) { Usage(); process.exit(0); }
if (args.length) { Usage(); process.exit(2); }

test('built tabs honor browser focus, scoped timing, and live reduced motion', async () => {
  const server = await createServer({ configFile: false, server: { host: '127.0.0.1', port: 0 }, esbuild: { jsx: 'automatic' } });
  let browser;
  try {
    await server.listen();
    // Use installed Chrome by default; never download a browser during the check.
    browser = await chromium.launch({ channel: process.env.ABMEX_BROWSER_CHANNEL || 'chrome', headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const address = server.httpServer.address();
    await page.goto(`http://127.0.0.1:${address.port}/tests/browser/tabs.html`);
    const alpha = page.getByRole('tab', { name: 'Alpha' });
    await alpha.waitFor();
    assert.equal(await page.getByRole('tablist').evaluate(el => getComputedStyle(el).display), 'flex');
    await alpha.focus();
    // Programmatic activation preserves focus on the tab during the state update.
    await page.getByRole('button', { name: 'Toggle disabled' }).evaluate(el => el.click());
    await page.waitForFunction(() => document.activeElement?.textContent === 'Beta');
    await page.getByRole('tablist').evaluate(el => { el.dir = 'rtl'; });
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => document.activeElement?.textContent === 'Gamma');
    await page.getByRole('button', { name: 'Toggle first tab' }).click();
    const exiting = page.locator('[data-slot="tab"][data-exiting]');
    await exiting.waitFor();
    assert.equal(await exiting.evaluate(el => el.getAnimations()[0]?.effect?.getTiming().duration), 5000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await exiting.waitFor({ state: 'detached' });
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await server.close();
  }
});
