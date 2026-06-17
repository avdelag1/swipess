#!/usr/bin/env node
/**
 * Captures light-theme elevation verification screenshots.
 * Requires: vite preview running on PORT (default 4173)
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'verification-screenshots');
const PORT = process.env.PREVIEW_PORT || '4173';
const BASE = `http://127.0.0.1:${PORT}`;

async function capture(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`✓ ${file}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Elevation system verification page
  await page.goto(`${BASE}/elevation-verify.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await capture(page, 'elevation-system-verify');

  // Landing page in light mode
  await page.addInitScript(() => {
    localStorage.setItem('swipess_theme_preference', 'light');
  });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await capture(page, 'landing-light');

  await browser.close();
  console.log('\nScreenshots saved to verification-screenshots/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});