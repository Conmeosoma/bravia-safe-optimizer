import type { Device } from '../../shared/src/index';
import vi from './i18n/vi.json';

export interface Session { token: string; candidates: string[]; configuredPath: string | null }
export class ApiError extends Error {
  constructor(message: string, public code?: string) { super(message); }
}
async function decode<T>(response: Response): Promise<T> {
  let data: T & { error?: string; code?: string };
  try { data = await response.json(); }
  catch { throw new ApiError(vi.networkError, 'DISCONNECTED'); }
  if (!response.ok) throw new ApiError(data.error ?? vi.requestError, data.code);
  return data;
}
async function request(url: string, init?: RequestInit): Promise<Response> {
  try { return await fetch(url, init); }
  catch { throw new ApiError(vi.networkError, 'DISCONNECTED'); }
}
export async function loadSession(signal?: AbortSignal): Promise<Session> {
  return decode<Session>(await request('/api/bootstrap', { signal }));
}
export async function postApi<T>(token: string, route: string, input: object = {}): Promise<T> {
  return decode<T>(await request('/api/' + route, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Session-Token': token }, body: JSON.stringify(input)
  }));
}
export async function scanAvailableDevices(path: string): Promise<{ session: Session; devices: Device[] }> {
  // A fresh session avoids a stale token after the development backend restarts.
  const session = await loadSession();
  if (session.configuredPath !== path) await postApi(session.token, 'adb/configure', { path });
  const result = await postApi<{ devices: Device[] }>(session.token, 'devices');
  return { session, devices: result.devices };
}
