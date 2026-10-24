import { afterEach, describe, expect, it } from 'vitest';
import { request, type Server } from 'node:http';
import { createApp, allowedRequest } from '../packages/backend/src/server';
import type { AdbCommand, Runner } from '../packages/shared/src/index';

const servers: Server[] = [];
function send(url: string, options: { method?: string; headers: Record<string, string>; body?: string }) {
  return new Promise<Response>((resolve, reject) => {
    const req = request(url, { method: options.method ?? 'GET', headers: options.headers }, res => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: res.statusCode, headers: res.headers as Record<string, string> })));
      res.on('error', reject);
    });
    req.on('error', reject); req.end(options.body);
  });
}
afterEach(async () => { await Promise.all(servers.map(server => new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())))); servers.length = 0; });
async function setup() {
  const calls: AdbCommand[] = [];
  const runner: Runner = { async run(command) { calls.push(command); return { stdout: command.kind === 'version' ? 'Android Debug Bridge version 1.0.41\n' : 'List of devices attached\n', stderr: '', exitCode: 0 }; } };
  const server = createApp({ runnerFactory: () => runner, discover: async () => ['C:\\Android SDK\\platform-tools\\adb.exe'] });
  servers.push(server); await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No test server');
  const base = `http://127.0.0.1:${address.port}`;
  const headers = { Host: '127.0.0.1:4317', Origin: 'http://127.0.0.1:5173', 'Content-Type': 'application/json' };
  return { calls, base, headers };
}
describe('Local HTTP boundary (mock runner only)', () => {
  it('rejects untrusted Host/Origin, including null and external domains', () => {
    expect(allowedRequest('evil.test:4317', undefined)).toBe(false);
    expect(allowedRequest('127.0.0.1:4317', 'null')).toBe(false);
    expect(allowedRequest('127.0.0.1:4317', 'https://evil.test')).toBe(false);
    expect(allowedRequest('127.0.0.1:4317', 'http://127.0.0.1:5173')).toBe(true);
  });
  it('requires session token even for local session operations', async () => {
    const { base, headers, calls } = await setup();
    const response = await send(base + '/api/adb/configure', { method: 'POST', headers, body: JSON.stringify({ path: 'C:\\Android SDK\\platform-tools\\adb.exe' }) });
    expect(response.status).toBe(403); expect(calls).toEqual([]); expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
  it('blocks cross-origin and forged Host requests before issuing tokens', async () => {
    const { base, headers, calls } = await setup();
    for (const untrusted of [{ ...headers, Host: 'evil.test:4317' }, { ...headers, Origin: 'https://evil.test' }, { ...headers, Origin: 'null' }]) {
      const response = await send(base + '/api/bootstrap', { headers: untrusted });
      expect(response.status).toBe(403);
      expect(await response.text()).not.toContain('token');
    }
    expect(calls).toEqual([]);
  });
  it('supports configure and empty USB diagnosis without device mutations', async () => {
    const { base, headers, calls } = await setup();
    const boot = await send(base + '/api/bootstrap', { headers }).then(r => r.json()) as { token: string };
    const sessionHeaders = { ...headers, 'X-Session-Token': boot.token };
    const configure = await send(base + '/api/adb/configure', { method: 'POST', headers: sessionHeaders, body: JSON.stringify({ path: 'C:\\Android SDK\\platform-tools\\adb.exe' }) });
    expect(configure.status).toBe(200);
    const scan = await send(base + '/api/devices', { method: 'POST', headers: sessionHeaders, body: '{}' });
    expect(await scan.json()).toEqual({ devices: [] });
    for (const endpoint of ['pair', 'connect', 'disable', 'enable', 'rollback', 'apply']) {
      const response = await send(base + '/api/' + endpoint, { method: 'POST', headers: sessionHeaders, body: '{}' });
      expect(response.status).toBe(404);
    }
    expect(calls.map(c => c.kind)).toEqual(['version', 'devices']);
  });
  it('rejects injection in adb.exe path before calling runner', async () => {
    const { base, headers, calls } = await setup();
    const boot = await send(base + '/api/bootstrap', { headers }).then(r => r.json()) as { token: string };
    const response = await send(base + '/api/adb/configure', { method: 'POST', headers: { ...headers, 'X-Session-Token': boot.token }, body: JSON.stringify({ path: 'C:\\adb.exe\n' }) });
    expect(response.status).toBe(400); expect(calls).toEqual([]);
  });
});
