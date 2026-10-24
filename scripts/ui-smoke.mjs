/* global console, URL, document, window */
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(new URL('../.browser-cache', import.meta.url));
const { chromium, expect } = await import('@playwright/test');

const vi = JSON.parse(await readFile(new URL('../packages/frontend/src/i18n/vi.json', import.meta.url), 'utf8'));
const browser = await chromium.launch({ headless: true, ...(process.env.BRAVIA_BROWSER_PATH ? { executablePath: process.env.BRAVIA_BROWSER_PATH } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });
const errors = [];
const calls = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('requestfailed', request => {
  // React StrictMode intentionally aborts the first bootstrap effect on remount.
  if (new URL(request.url()).pathname === '/api/bootstrap' && request.failure()?.errorText === 'net::ERR_ABORTED') return;
  errors.push(request.url() + ': ' + request.failure()?.errorText);
});
page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
const identity = { serialno: 'MOCK-ONLY-SERIAL', manufacturer: 'Sony', model: 'MOCK-BRAVIA', device: 'mock_tv', fingerprint: 'mock/fixture/build', androidId: null };
const packages = [
  { name: 'vn.vtv.vtvgotv', kind: 'third-party', enabled: true },
  { name: 'com.google.android.youtube.tv', kind: 'system', enabled: true },
  { name: 'com.netflix.ninja', kind: 'system', enabled: false },
  { name: 'com.example.mock.other', kind: 'third-party', enabled: true }
];
// Every API call is intercepted. Browser checks never reach ADB or a real TV.
await page.route('**/api/**', async route => {
  const endpoint = new URL(route.request().url()).pathname;
  calls.push(endpoint);
  const payloads = {
    '/api/bootstrap': { token: 'mock-session', candidates: ['C:\\Mock SDK\\adb.exe'], configuredPath: null },
    '/api/adb/configure': { version: 'Android Debug Bridge version 1.0.41 — MOCK' },
    '/api/devices': { devices: [{ serial: 'MOCK_SERIAL', state: 'device', details: 'model:MOCK-BRAVIA' }] },
    '/api/select': { serial: 'MOCK_SERIAL', identity, ticket: 'mock-ticket' },
    '/api/confirm': { confirmed: true },
    '/api/packages': { packages, scannedAt: '2026-10-23T12:00:00.000Z' }
  };
  if (!Object.hasOwn(payloads, endpoint)) throw new Error('Unexpected API in UI test: ' + endpoint);
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payloads[endpoint]) });
});
try {
  await page.goto('http://127.0.0.1:5173/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(vi.tvPreview.titleLineOne);
  await expect(page.locator('.tv-app-card')).toHaveCount(3);
  await expect(page.locator('.tv-app-card .app-state').first()).toHaveText(vi.notScanned);
  await expect(page.locator('.readonly')).toBeVisible();
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1050 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    await expect(page.getByRole('navigation').getByRole('button', { name: vi.nav.connection, exact: true })).toBeVisible();
  }
  await page.screenshot({ path: 'reports/dashboard-tv-desktop.png', fullPage: true });
  await page.getByRole('navigation').getByRole('button', { name: vi.nav.connection, exact: true }).click();
  await page.getByRole('button', { name: vi.scan, exact: true }).click();
  await expect(page.getByText('MOCK_SERIAL', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: vi.choose, exact: true }).click();
  await page.getByRole('button', { name: vi.confirm, exact: true }).click();
  await expect(page.locator('.badge')).toHaveText(vi.badge.connected);
  await page.getByRole('navigation').getByRole('button', { name: vi.nav.apps, exact: true }).click();
  await page.getByRole('button', { name: vi.scanApps, exact: true }).click();
  await expect(page.locator('.favorite-vtvgo .app-state')).toHaveText(vi.enabled);
  await expect(page.locator('.favorite-netflix .app-state')).toHaveText(vi.disabled);
  await expect(page.locator('table')).toHaveCount(0);
  await page.getByRole('button', { name: vi.showAllPackages, exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(4);
  await page.getByRole('searchbox', { name: vi.search }).fill('netflix');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: vi.hideAllPackages, exact: true }).click();
  await expect(page.locator('table')).toHaveCount(0);
  await page.getByRole('navigation').getByRole('button', { name: vi.nav.overview, exact: true }).click();
  await expect(page.locator('.tv-card-netflix .app-state')).toHaveText(vi.disabled);
  await page.locator('.tv-card-vtvgo').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(vi.titles.apps);
  await page.getByRole('navigation').getByRole('button', { name: vi.nav.overview, exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator('.tv-app-card')).toHaveCount(3);
  await expect(page.locator('.readonly')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) throw new Error('Mobile layout overflows horizontally');
  await page.screenshot({ path: 'reports/dashboard-tv-mobile.png', fullPage: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const transitionDuration = await page.locator('.tv-app-card').first().evaluate(element => window.getComputedStyle(element).transitionDuration);
  expect(transitionDuration).toBe('0s');
  expect(errors).toEqual([]);
  console.log('Đạt: UI kính mờ desktop/mobile, 3 ứng dụng, chọn/xác nhận TV mock, trạng thái package, tìm kiếm, danh sách thu gọn; không gọi TV thật.');
  console.log('API mock: ' + [...new Set(calls)].join(', '));
} catch (error) {
  console.error(JSON.stringify({ browserErrors: errors, page: await page.locator('body').innerText() }));
  throw error;
} finally { await browser.close(); }
