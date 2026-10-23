import { fail, validSerial, validPackage, type Device, type PackageRecord } from '../../shared/src/index.js';

export function parseDevices(output: string): Device[] {
  const lines = output.replace(/\r/g, '').split('\n').filter(line => line.trim());
  const header = lines.indexOf('List of devices attached');
  if (header < 0) throw new Error('Đầu ra danh sách thiết bị không đúng định dạng ADB.');
  const devices: Device[] = [];
  for (const line of lines.slice(header + 1)) {
    const match = /^(\S+)\s+(device|unauthorized|offline|recovery|sideload|bootloader|no permissions)(?:\s+(.*))?$/.exec(line);
    if (!match || !validSerial(match[1])) fail('INVALID');
    devices.push({ serial: match[1], state: ['device', 'unauthorized', 'offline'].includes(match[2]!) ? match[2] as Device['state'] : 'unknown', details: match[3] ?? '' });
  }
  if (new Set(devices.map(d => d.serial)).size !== devices.length) fail('INVALID');
  return devices;
}
export function parseText(output: string): string {
  const value = output.trim();
  if (!value || value.length > 2048 || /[\x00-\x1f\x7f]/.test(value) || /^(null|unknown|error.*)$/i.test(value)) throw new Error('Thiếu dữ liệu hoặc dữ liệu không đúng định dạng.');
  return value;
}
export function parseApi(output: string): number {
  if (!/^\d{1,3}$/.test(output.trim()) || Number(output.trim()) < 1) throw new Error('API level không hợp lệ.');
  return Number(output.trim());
}
export function parseUptime(output: string): number {
  const match = /^(\d+(?:\.\d+)?)\s+\d+(?:\.\d+)?$/.exec(output.trim());
  if (!match || !Number.isFinite(Number(match[1]))) throw new Error('Uptime không đúng định dạng.');
  return Number(match[1]);
}
function integer(value: string): number {
  const n = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(n) || n < 0) throw new Error('Giá trị dung lượng không hợp lệ.');
  return n;
}
export function parseMemory(output: string): { totalKiB: number; availableKiB: number } {
  const total = /^MemTotal:\s+(\d+)\s+kB\s*$/m.exec(output);
  const available = /^MemAvailable:\s+(\d+)\s+kB\s*$/m.exec(output);
  if (!total || !available) throw new Error('Không có MemTotal/MemAvailable theo đơn vị kB.');
  const totalKiB = integer(total[1]!); const availableKiB = integer(available[1]!);
  if (!totalKiB || availableKiB > totalKiB) throw new Error('Dung lượng RAM không nhất quán.');
  return { totalKiB, availableKiB };
}
export function parseStorage(output: string): { totalKiB: number; availableKiB: number } {
  const lines = output.trim().split(/\r?\n/);
  if (!/Filesystem/i.test(lines[0] ?? '')) throw new Error('Thiếu tiêu đề df.');
  const row = lines.slice(1).find(line => /\s\/data\s*$/.test(line));
  const match = row && /^\S+\s+(\d+)\s+(\d+)\s+(\d+)\s+\d+%\s+\/data\s*$/.exec(row);
  if (!match) throw new Error('df -k /data không đúng định dạng được hỗ trợ.');
  const totalKiB = integer(match[1]!); const used = integer(match[2]!); const availableKiB = integer(match[3]!);
  if (!totalKiB || used > totalKiB || availableKiB > totalKiB || used + availableKiB > totalKiB) throw new Error('Dung lượng bộ nhớ lưu trữ không nhất quán.');
  return { totalKiB, availableKiB };
}
export function parseLauncher(output: string): string {
  const lines = output.trim().split(/\r?\n/);
  if (lines.length !== 1) throw new Error('Không xác định được launcher duy nhất.');
  const match = /^([A-Za-z][A-Za-z0-9_.]*)\/([A-Za-z0-9_.$]+)$/.exec(lines[0]!);
  if (!match || !validPackage(match[1]) || /(?:^|\.)ResolverActivity$/.test(match[2]!)) throw new Error('Không tìm thấy launcher mặc định xác định.');
  return match[1]!;
}
export function parsePackages(output: string): Set<string> {
  const names = new Set<string>();
  for (const line of output.split(/\r?\n/).filter(Boolean)) {
    const match = /^package:(\S+)$/.exec(line);
    if (!match || !validPackage(match[1])) throw new Error('Danh sách package không đúng định dạng.');
    names.add(match[1]);
  }
  return names;
}
export function mergePackages(third: Set<string>, system: Set<string>, disabled: Set<string>): PackageRecord[] {
  if ([...third].some(p => system.has(p)) || [...disabled].some(p => !third.has(p) && !system.has(p))) throw new Error('Các danh sách package không nhất quán; hãy quét lại.');
  return [...system, ...third].sort().map(name => ({ name, kind: system.has(name) ? 'system' : 'third-party', enabled: !disabled.has(name) }));
}
