import { describe, expect, it } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { commandArgs, validEndpoint, validSerial, validPackage, validAdbPath, validPairingCode, classifyError, type AdbCommand, type AdbResult, type Runner, type DeviceCommand } from '../packages/shared/src/index';
import { RealRunner } from '../packages/backend/src/adb/runner';
import { InspectionService } from '../packages/backend/src/service';
import { parseDevices, parseMemory, parseStorage, parseUptime, parsePackages, mergePackages, parseLauncher } from '../packages/backend/src/parsers';

const success = (stdout: string): AdbResult => ({ stdout, stderr: '', exitCode: 0 });
const base: Record<DeviceCommand, string> = {
  serialno: 'OWNER-TV-42\n', manufacturer: 'Sony\n', model: 'MOCK-TV-ONLY\n', device: 'mock_device\n', fingerprint: 'Sony/mock/device:version/build/test:user/release-keys\n', androidId: '0a0b0c0d0e0f0102\n',
  release: '12\n', api: '31\n', abi: 'arm64-v8a\n', uptime: '512.34 1200.00\n', memory: 'MemTotal: 2048000 kB\nMemAvailable: 712345 kB\n', storage: 'Filesystem 1K-blocks Used Available Use% Mounted on\n/dev/block/mock 4096000 1024000 3072000 25% /data\n',
  launcher: 'com.example.home/.HomeActivity\n', thirdParty: 'package:com.example.optional\n', system: 'package:android\npackage:com.example.home\n', disabled: 'package:com.example.optional\n'
};
class MockRunner implements Runner {
  calls: AdbCommand[] = [];
  devices = 'List of devices attached\nMOCK_SERIAL device product:mock model:MOCK-TV-ONLY\n';
  outputs = { ...base };
  failure: Partial<Record<DeviceCommand, AdbResult>> = {};
  async run(command: AdbCommand) {
    commandArgs(command); this.calls.push(command);
    if (command.kind === 'devices') return success(this.devices);
    if (command.kind === 'version') return success('Android Debug Bridge version 1.0.41');
    return this.failure[command.command] ?? success(this.outputs[command.command]);
  }
}
async function selected(runner = new MockRunner()) {
  const service = new InspectionService(runner);
  const selection = await service.select('MOCK_SERIAL');
  await service.confirm(selection.ticket);
  return { runner, service };
}
describe('Input validation and exact allowlist', () => {
  it.each(['a;reboot', '$(id)', 'a b', 'a\nb', 'a\r', 'a\t', '`id`', '-s', '../adb', 'x&y', 'x|y'])('rejects serial injection %j', value => expect(validSerial(value)).toBe(false));
  it.each(['a;reboot', '$(id)', 'com.x y', 'com.x\n', 'com.x\r', '.com.x', 'com..x', '-com.x', 'com.x/../../'])('rejects package injection %j', value => expect(validPackage(value)).toBe(false));
  it.each(['192.168.1.1:5555;reboot', '$(id):5555', '192.168.1.1:5555\n', '192.168.1.1: 5555', '256.1.1.1:5', '01.2.3.4:5', '1.2.3.4:0', '1.2.3.4:65536', 'localhost:5555', '[::1]:5555'])('rejects endpoint %j', value => expect(validEndpoint(value)).toBe(false));
  it('accepts validated identifiers and paths with spaces', () => {
    expect(validSerial('USB-123_abc')).toBe(true); expect(validEndpoint('192.168.1.2:37123')).toBe(true);
    expect(validSerial('192.168.1.2:37123')).toBe(true); expect(validPackage('android')).toBe(true);
    expect(validAdbPath('C:\\Android SDK\\platform-tools\\adb.exe')).toBe(true);
    expect(validAdbPath('adb.exe')).toBe(false); expect(validAdbPath('C:\\adb.exe\n')).toBe(false);
    expect(validPairingCode('012345')).toBe(true); expect(validPairingCode('123456\n')).toBe(false);
  });
  it('requires the full command template and selected serial', () => {
    expect(commandArgs({ kind: 'read', serial: 'MOCK_SERIAL', command: 'system' })).toEqual(['-s', 'MOCK_SERIAL', 'shell', 'pm', 'list', 'packages', '-s']);
    expect(() => commandArgs({ kind: 'read', serial: 'a;reboot', command: 'model' })).toThrow();
    for (const command of ['pair', 'connect', 'disable', 'tcpip', 'root', 'reboot', 'clear', 'uninstall', 'toString', '__proto__']) {
      expect(() => commandArgs({ kind: 'read', serial: 'MOCK_SERIAL', command } as AdbCommand)).toThrow();
      expect(() => commandArgs({ kind: command } as AdbCommand)).toThrow();
    }
  });
  it('real runner throws before touching ADB under tests', async () => {
    await expect(new RealRunner('C:\\Android SDK\\platform-tools\\adb.exe').run({ kind: 'devices' })).rejects.toThrow('forbidden under tests');
  });
  it('only runner.ts imports child_process, and no executable templates mutate the TV', async () => {
    async function files(dir: string): Promise<string[]> {
      const entries = await readdir(dir, { withFileTypes: true });
      const nested = await Promise.all(entries.filter(e => e.name !== 'dist' && e.name !== 'node_modules').map(e => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]));
      return nested.flat();
    }
    for (const file of (await files('packages')).filter(f => /\.[cm]?[jt]sx?$/.test(f))) {
      const source = await readFile(file, 'utf8');
      if (/from\s+['"](?:node:)?child_process['"]|(?:import|require)\(['"](?:node:)?child_process/.test(source)) expect(file.replaceAll('\\', '/')).toBe('packages/backend/src/adb/runner.ts');
    }
    for (const command of Object.keys(base) as DeviceCommand[]) {
      const args = commandArgs({ kind: 'read', serial: 'MOCK_SERIAL', command });
      expect(args.join(' ')).not.toMatch(/disable|enable|uninstall|clear|tcpip|pair|connect|root|remount|reboot|sideload|\brm\b|\bdd\b|mkfs/);
    }
  });
});
describe('Discovery and identity with mock output', () => {
  it('USB unavailable is an empty list, not a command error', () => expect(parseDevices('List of devices attached\n\n')).toEqual([]));
  it.each(['unauthorized', 'offline'])('blocks %s', async state => {
    const runner = new MockRunner(); runner.devices = `List of devices attached\nMOCK_SERIAL ${state}\n`;
    await expect(new InspectionService(runner).select('MOCK_SERIAL')).rejects.toMatchObject({ code: state.toUpperCase() });
    expect(runner.calls).toHaveLength(1);
  });
  it('multiple devices never imply selection', async () => {
    const runner = new MockRunner(); runner.devices += 'OTHER_SERIAL device model:Other\n';
    const service = new InspectionService(runner); expect(await service.devices()).toHaveLength(2);
    await expect(service.inspect()).rejects.toThrow('xác nhận');
    await service.select('MOCK_SERIAL'); expect(runner.calls.filter(c => c.kind === 'read').every(c => c.serial === 'MOCK_SERIAL')).toBe(true);
  });
  it('rejects non-Sony manufacturer', async () => {
    const runner = new MockRunner(); runner.outputs.manufacturer = 'Other';
    await expect(new InspectionService(runner).select('MOCK_SERIAL')).rejects.toThrow('không phải Sony');
  });
  it('wrong model or identity change invalidates confirmation', async () => {
    const { runner, service } = await selected(); runner.outputs.model = 'DIFFERENT-MOCK-MODEL';
    await expect(service.inspect()).rejects.toThrow('Danh tính'); await expect(service.inspect()).rejects.toThrow('xác nhận');
  });
  it('requires explicit identity confirmation and correct ticket', async () => {
    const service = new InspectionService(new MockRunner()); await service.select('MOCK_SERIAL');
    await expect(service.inspect()).rejects.toThrow('xác nhận'); await expect(service.confirm('wrong-ticket')).rejects.toThrow();
  });
  it('dropped connection clears the selected device', async () => {
    const { runner, service } = await selected(); runner.devices = 'List of devices attached\n';
    await expect(service.inventory()).rejects.toMatchObject({ code: 'DISCONNECTED' });
    runner.devices = 'List of devices attached\nMOCK_SERIAL device\n'; await expect(service.inventory()).rejects.toThrow('xác nhận');
  });
  it('returns validated values, package union and disabled state', async () => {
    const { service } = await selected(); const info = await service.inspect();
    expect(info.api).toEqual({ available: true, value: 31 });
    expect(info.memory).toEqual({ available: true, value: { totalKiB: 2048000, availableKiB: 712345 } });
    const inventory = await service.inventory(); expect(inventory.packages).toContainEqual({ name: 'com.example.optional', kind: 'third-party', enabled: false });
    expect(inventory.packages).toContainEqual({ name: 'android', kind: 'system', enabled: true });
  });
  it('unsupported command reports unavailable with reason', async () => {
    const { runner, service } = await selected(); runner.failure.storage = { stdout: '', stderr: 'unknown command', exitCode: 1 };
    expect((await service.inspect()).storage).toMatchObject({ available: false, reason: expect.any(String) });
  });
  it('network timeout aborts reading and requires re-selection', async () => {
    const { runner, service } = await selected(); runner.failure.memory = { stdout: '', stderr: 'connection timed out', exitCode: 1 };
    await expect(service.inspect()).rejects.toMatchObject({ code: 'TIMEOUT' }); await expect(service.inspect()).rejects.toThrow('xác nhận');
  });
  it('does not accept a zero-exit device error as data', async () => {
    const { runner, service } = await selected(); runner.failure.api = { stdout: 'Error: unknown command', stderr: '', exitCode: 0 };
    expect((await service.inspect()).api).toMatchObject({ available: false });
  });
  it('classifies pairing failure, wrong endpoint and unsupported output', () => {
    expect(classifyError('Failed to pair: authentication failure')).toBe('PAIRING_FAILED');
    expect(classifyError('failed to connect: Connection refused')).toBe('NETWORK');
    expect(classifyError('unknown command')).toBe('UNSUPPORTED');
  });
  it('rejects concurrent operations without running the second operation', async () => {
    const service = new InspectionService(new MockRunner());
    let release!: () => void;
    const pending = service.exclusive(() => new Promise<void>(resolve => { release = resolve; }));
    let executed = false;
    await expect(service.exclusive(async () => { executed = true; })).rejects.toThrow('Đang xử lý');
    expect(executed).toBe(false); release(); await pending;
    await expect(service.exclusive(async () => 'ready')).resolves.toBe('ready');
  });
});
describe('Malformed device output', () => {
  it('rejects fabricated or inconsistent diagnostic values', () => {
    expect(() => parseMemory('MemTotal: 10 kB\nMemAvailable: 20 kB\n')).toThrow();
    expect(() => parseMemory('MemFree: 10 kB')).toThrow();
    expect(() => parseStorage('Filesystem\n/dev/x 10 5 20 0% /data')).toThrow();
    expect(() => parseStorage('unsupported')).toThrow(); expect(() => parseUptime('-1 0')).toThrow();
    expect(() => parseLauncher('No activity found')).toThrow();
    expect(() => parseLauncher('android/com.android.internal.app.ResolverActivity')).toThrow();
    expect(() => parsePackages('package:com.x;reboot')).toThrow();
    expect(() => mergePackages(new Set(['com.x']), new Set(), new Set(['com.y']))).toThrow();
    expect(() => parseDevices('not ADB')).toThrow();
  });
});
