import { afterEach, describe, expect, it, vi } from 'vitest';
import { scanAvailableDevices } from '../packages/frontend/src/api';

afterEach(() => vi.unstubAllGlobals());
const adbPath = 'C:\\Android SDK\\platform-tools\\adb.exe';
const device = { serial: '192.168.1.11:5555', state: 'device', details: 'model:MOCK_TV' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

describe('Dashboard device scanning with mocked HTTP', () => {
  it('uses the new backend token and configures ADB after a restart', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json({ token: 'fresh-token', candidates: [adbPath], configuredPath: null }))
      .mockResolvedValueOnce(json({ version: 'mock-version' })).mockResolvedValueOnce(json({ devices: [device] }));
    vi.stubGlobal('fetch', fetchMock);
    expect((await scanAvailableDevices(adbPath)).devices).toEqual([device]);
    expect(fetchMock.mock.calls.map(call => call[0])).toEqual(['/api/bootstrap', '/api/adb/configure', '/api/devices']);
    expect(fetchMock.mock.calls[1]?.[1].headers['X-Session-Token']).toBe('fresh-token');
    expect(fetchMock.mock.calls[2]?.[1].headers['X-Session-Token']).toBe('fresh-token');
  });
  it('scans an existing ADB session without selecting or confirming a device', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json({ token: 'session-token', candidates: [adbPath], configuredPath: adbPath }))
      .mockResolvedValueOnce(json({ devices: [device] }));
    vi.stubGlobal('fetch', fetchMock);
    expect((await scanAvailableDevices(adbPath)).devices).toEqual([device]);
    expect(fetchMock.mock.calls.map(call => call[0])).toEqual(['/api/bootstrap', '/api/devices']);
  });
  it('reports a backend outage in Vietnamese rather than an empty device list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(scanAvailableDevices(adbPath)).rejects.toThrow('Không liên lạc được backend');
  });
  it('distinguishes malformed API output from a successful empty scan', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('proxy unavailable', { status: 502 })));
    await expect(scanAvailableDevices(adbPath)).rejects.toThrow('Không liên lạc được backend');
  });
  it('does not scan if ADB configuration fails', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json({ token: 'session-token', configuredPath: null, candidates: [] }))
      .mockResolvedValueOnce(json({ error: 'Không tìm thấy ADB.', code: 'ADB_MISSING' }, 400));
    vi.stubGlobal('fetch', fetchMock);
    await expect(scanAvailableDevices(adbPath)).rejects.toThrow('Không tìm thấy ADB');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
