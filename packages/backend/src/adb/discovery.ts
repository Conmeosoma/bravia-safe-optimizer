import { access } from 'node:fs/promises';
import path from 'node:path';
import { validAdbPath } from '../../../shared/src/index.js';

export async function discoverAdb(): Promise<string[]> {
  const roots = [process.env.ANDROID_SDK_ROOT, process.env.ANDROID_HOME,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : undefined];
  const candidates = roots.filter((v): v is string => Boolean(v)).map(v => path.join(v, 'platform-tools', 'adb.exe'));
  for (const entry of (process.env.PATH ?? '').split(path.delimiter)) candidates.push(path.join(entry, 'adb.exe'));
  const found: string[] = [];
  for (const candidate of [...new Set(candidates)]) {
    if (!validAdbPath(candidate)) continue;
    try { await access(candidate); found.push(candidate); } catch { /* Missing candidates are expected. */ }
  }
  return found;
}
