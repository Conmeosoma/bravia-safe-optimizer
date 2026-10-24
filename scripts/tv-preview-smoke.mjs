/* global console, URL, document, window */
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(new URL('../.browser-cache', import.meta.url));
const { chromium, expect } = await import('@playwright/test');
const vi = JSON.parse(await readFile(new URL('../packages/frontend/src/i18n/vi.json', import.meta.url), 'utf8'));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
const apiCalls = [];
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('**/api/**', async route => { apiCalls.push(route.request().url()); await route.abort(); });
try {
  await page.goto('http://127.0.0.1:5173/?preview=tv');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(vi.tvPreview.titleLineOne);
  await expect(page.locator('.tv-app-card')).toHaveCount(3);
  const cards = page.locator('.tv-app-card');
  await page.getByRole('button', { name: vi.tvPreview.explore, exact: true }).click();
  await expect(cards.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(cards.nth(1)).toBeFocused();
  await expect(cards.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('heading')).toHaveText(vi.favoriteNames.youtube);
  await expect(page.getByRole('button', { name: vi.tvPreview.close, exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: vi.tvPreview.close, exact: true })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(cards.nth(1)).toBeFocused();
  await page.keyboard.press('End'); await expect(cards.nth(2)).toBeFocused();
  await page.keyboard.press('Home'); await expect(cards.nth(0)).toBeFocused();
  await page.getByRole('heading', { level: 1 }).click();
  for (const [width, height] of [[375,844],[768,1024],[1024,768],[1440,980],[1920,1080]]) {
    await page.setViewportSize({ width, height });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    if (width === 1920) expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
    await expect(cards.nth(0)).toBeVisible();
    if ([375,1440,1920].includes(width)) await page.screenshot({ path: `reports/tv-home-${width}.png`, fullPage: true });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await cards.nth(0).evaluate(element => window.getComputedStyle(element).transitionDuration)).toBe('0s');
  await page.getByRole('button', { name: vi.tvPreview.settings, exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(vi.tvPreview.settingsCopy);
  await page.getByRole('button', { name: vi.tvPreview.close, exact: true }).click();
  expect(apiCalls).toEqual([]); expect(errors).toEqual([]);
  console.log('Đạt: bản thiết kế TV ở 375/768/1024/1440/1920px; 3 ứng dụng; mũi tên/Home/End; dialog/focus/Escape; reduced motion; không có request API hoặc ADB.');
} finally { await browser.close(); }
