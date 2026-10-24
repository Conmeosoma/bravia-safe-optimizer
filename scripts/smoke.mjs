/* global console, fetch */
import { createApp } from '../packages/backend/dist/backend/src/server.js';

// This smoke check serves the real build but never invokes ADB.
const app = createApp({ frontendDir: './packages/frontend/dist', discover: async () => [] });
await new Promise(resolve => app.listen(4317, '127.0.0.1', resolve));
try {
  const root = await fetch('http://127.0.0.1:4317/');
  const html = await root.text();
  if (root.status !== 200 || !html.includes('lang="vi"')) throw new Error('Vietnamese HTML was not served');
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^" ]+)"/g)].map(match => match[1]);
  if (assets.length < 2) throw new Error('Missing frontend assets');
  for (const asset of assets) {
    const response = await fetch('http://127.0.0.1:4317' + asset);
    if (response.status !== 200) throw new Error('Built asset was not served');
  }
  const bootstrap = await fetch('http://127.0.0.1:4317/api/bootstrap');
  const session = await bootstrap.json();
  if (bootstrap.status !== 200 || session.mode !== 'READ ONLY') throw new Error('Invalid bootstrap');
  console.log('Đạt: HTML tiếng Việt, JS/CSS và API READ ONLY của bản build; không gọi ADB.');
} finally {
  app.closeAllConnections();
  await new Promise(resolve => app.close(resolve));
}
