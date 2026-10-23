export type DeviceState = 'device' | 'unauthorized' | 'offline' | 'unknown';
export interface Device { serial: string; state: DeviceState; details: string }
export interface DeviceIdentity {
  serialno: string; manufacturer: string; model: string; device: string;
  fingerprint: string; androidId: string | null;
}
export type Reading<T> = { available: true; value: T } | { available: false; reason: string };
export interface DeviceInfo {
  identity: DeviceIdentity;
  release: Reading<string>; api: Reading<number>; abi: Reading<string>;
  uptimeSeconds: Reading<number>;
  memory: Reading<{ totalKiB: number; availableKiB: number }>;
  storage: Reading<{ totalKiB: number; availableKiB: number }>;
  launcher: Reading<string>;
  scannedAt: string;
}
export interface PackageRecord { name: string; kind: 'system' | 'third-party'; enabled: boolean }
export interface Inventory { packages: PackageRecord[]; scannedAt: string }
export interface AdbResult { stdout: string; stderr: string; exitCode: number }
export type ErrorCode = 'ADB_MISSING' | 'UNAUTHORIZED' | 'OFFLINE' | 'TIMEOUT' | 'PAIRING_FAILED' | 'NETWORK' | 'DISCONNECTED' | 'UNSUPPORTED' | 'INVALID' | 'COMMAND_FAILED';
export class AppError extends Error {
  constructor(public code: ErrorCode, message: string) { super(message); }
}
export const errorMessages: Record<ErrorCode, string> = {
  ADB_MISSING: 'Không tìm thấy ADB. Hãy chọn adb.exe từ Platform-Tools chính thức của Google.',
  UNAUTHORIZED: 'Thiết bị chưa cấp quyền. Kiểm tra và chấp nhận thông báo trên TV.',
  OFFLINE: 'Thiết bị đang ngoại tuyến. Kiểm tra TV và kết nối rồi quét lại.',
  TIMEOUT: 'Hết thời gian chờ. Kiểm tra IP, cổng, mạng và trạng thái TV.',
  PAIRING_FAILED: 'Ghép đôi thất bại. Kiểm tra mã còn hiệu lực và cổng ghép đôi trên TV.',
  NETWORK: 'Không kết nối được địa chỉ này. Kiểm tra IP và cổng kết nối hiển thị trên TV.',
  DISCONNECTED: 'Kết nối thiết bị đã mất. Quét lại và xác nhận lại danh tính TV.',
  UNSUPPORTED: 'Thiết bị không hỗ trợ lệnh hoặc không cho phép đọc dữ liệu này.',
  INVALID: 'Dữ liệu không hợp lệ. Không chấp nhận ký tự shell, khoảng trắng hoặc xuống dòng.',
  COMMAND_FAILED: 'Lệnh ADB thất bại. Không thể xác nhận kết quả.'
};
export function fail(code: ErrorCode): never { throw new AppError(code, errorMessages[code]); }
export function validPackage(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 255 && /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)*$/.test(value);
}
export function validIp(value: unknown): value is string {
  return typeof value === 'string' && /^(?:0|[1-9]\d{0,2})(?:\.(?:0|[1-9]\d{0,2})){3}$/.test(value) && value.split('.').every(n => Number(n) <= 255);
}
export function validPort(value: unknown): value is string {
  return typeof value === 'string' && /^[1-9]\d{0,4}$/.test(value) && Number(value) <= 65535;
}
export function validEndpoint(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parts = value.split(':');
  return parts.length === 2 && validIp(parts[0]) && validPort(parts[1]);
}
export function validSerial(value: unknown): value is string {
  return typeof value === 'string' && (validEndpoint(value) || /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value));
}
export function validPairingCode(value: unknown): value is string { return typeof value === 'string' && /^\d{6}$/.test(value); }
export function validAdbPath(value: unknown): value is string {
  return typeof value === 'string' && value.length < 1024 && /^[A-Za-z]:\\/.test(value) && !/[\x00-\x1f"<>|]/.test(value) && /\\adb\.exe$/i.test(value);
}
export const properties = {
  serialno: 'ro.serialno', manufacturer: 'ro.product.manufacturer', model: 'ro.product.model',
  device: 'ro.product.device', fingerprint: 'ro.build.fingerprint',
  release: 'ro.build.version.release', api: 'ro.build.version.sdk', abi: 'ro.product.cpu.abi'
} as const;
export const deviceTemplates = {
  androidId: ['shell', 'settings', 'get', 'secure', 'android_id'],
  uptime: ['shell', 'cat', '/proc/uptime'], memory: ['shell', 'cat', '/proc/meminfo'],
  storage: ['shell', 'df', '-k', '/data'],
  launcher: ['shell', 'cmd', 'package', 'resolve-activity', '--brief', '-a', 'android.intent.action.MAIN', '-c', 'android.intent.category.HOME'],
  thirdParty: ['shell', 'pm', 'list', 'packages', '-3'],
  system: ['shell', 'pm', 'list', 'packages', '-s'],
  disabled: ['shell', 'pm', 'list', 'packages', '-d']
} as const;
export type DeviceCommand = keyof typeof properties | keyof typeof deviceTemplates;
export type AdbCommand = { kind: 'version' | 'devices' } | { kind: 'read'; serial: string; command: DeviceCommand };
export function commandArgs(command: AdbCommand): string[] {
  if (command.kind === 'version') return ['version'];
  if (command.kind === 'devices') return ['devices', '-l'];
  if (command.kind !== 'read' || !validSerial(command.serial)) return fail('INVALID');
  const prop = Object.hasOwn(properties, command.command) ? properties[command.command as keyof typeof properties] : undefined;
  const template = Object.hasOwn(deviceTemplates, command.command) ? deviceTemplates[command.command as keyof typeof deviceTemplates] : undefined;
  if (!prop && !template) return fail('INVALID');
  return ['-s', command.serial, ...(prop ? ['shell', 'getprop', prop] : [...template!])];
}
export interface Runner { run(command: AdbCommand): Promise<AdbResult> }
export function classifyError(text: string): ErrorCode {
  if (/unauthorized/i.test(text)) return 'UNAUTHORIZED';
  if (/offline/i.test(text)) return 'OFFLINE';
  if (/timed?\s*out|timeout/i.test(text)) return 'TIMEOUT';
  if (/pair|authentication/i.test(text)) return 'PAIRING_FAILED';
  if (/refused|unreachable|cannot connect|failed to connect|no route/i.test(text)) return 'NETWORK';
  if (/device.*not found|no devices|closed|disconnected/i.test(text)) return 'DISCONNECTED';
  if (/not found|unknown command|not supported|permission denied|securityexception/i.test(text)) return 'UNSUPPORTED';
  return 'COMMAND_FAILED';
}
