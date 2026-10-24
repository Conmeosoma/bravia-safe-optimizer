import { randomUUID } from 'node:crypto';
import { AppError, fail, classifyError, errorMessages, validSerial, type Runner, type DeviceCommand, type DeviceIdentity, type DeviceInfo, type Inventory, type Reading } from '../../shared/src/index.js';
import { parseDevices, parseText, parseApi, parseUptime, parseMemory, parseStorage, parseLauncher, parsePackages, mergePackages } from './parsers.js';

export class InspectionService {
  private selected: { serial: string; identity: DeviceIdentity; ticket: string; confirmed: boolean } | null = null;
  private busy = false;
  constructor(private readonly runner: Runner) {}
  async exclusive<T>(action: () => Promise<T>): Promise<T> {
    if (this.busy) throw new AppError('INVALID', 'Đang xử lý yêu cầu khác. Vui lòng chờ.');
    this.busy = true;
    try { return await action(); } finally { this.busy = false; }
  }
  clear() { this.selected = null; }
  async devices() {
    const result = await this.runner.run({ kind: 'devices' });
    this.check(result);
    const devices = parseDevices(result.stdout);
    if (this.selected && !devices.some(d => d.serial === this.selected!.serial && d.state === 'device')) this.clear();
    return devices;
  }
  private check(result: { exitCode: number; stdout: string; stderr: string }) {
    if (result.exitCode !== 0 || /^(?:error:|adb: error:|Exception|SecurityException|Error:)/mi.test(result.stdout + '\n' + result.stderr)) {
      const code = classifyError(result.stderr + '\n' + result.stdout);
      throw new AppError(code, errorMessages[code]);
    }
  }
  private async read(serial: string, command: DeviceCommand): Promise<string> {
    const result = await this.runner.run({ kind: 'read', serial, command });
    this.check(result); return result.stdout;
  }
  private async identity(serial: string): Promise<DeviceIdentity> {
    const identity: DeviceIdentity = {
      serialno: parseText(await this.read(serial, 'serialno')),
      manufacturer: parseText(await this.read(serial, 'manufacturer')),
      model: parseText(await this.read(serial, 'model')),
      device: parseText(await this.read(serial, 'device')),
      fingerprint: parseText(await this.read(serial, 'fingerprint')),
      androidId: null
    };
    try {
      const id = (await this.read(serial, 'androidId')).trim();
      if (/^[0-9a-f]{16}$/i.test(id)) identity.androidId = id;
    } catch (error) {
      if (!(error instanceof AppError) || !['UNSUPPORTED', 'COMMAND_FAILED'].includes(error.code)) throw error;
    }
    return identity;
  }
  async select(serial: unknown) {
    this.clear();
    if (!validSerial(serial)) fail('INVALID');
    const device = (await this.devices()).find(d => d.serial === serial);
    if (!device) fail('DISCONNECTED');
    if (device.state === 'unauthorized') fail('UNAUTHORIZED');
    if (device.state === 'offline') fail('OFFLINE');
    if (device.state !== 'device') fail('INVALID');
    const identity = await this.identity(serial);
    if (identity.manufacturer.toLowerCase() !== 'sony') throw new AppError('INVALID', 'Nhà sản xuất đọc được không phải Sony. Đã chặn chọn thiết bị; không suy đoán đây là TV của bạn.');
    const ticket = randomUUID();
    this.selected = { serial, identity, ticket, confirmed: false };
    return { serial, identity, ticket };
  }
  async confirm(ticket: unknown) {
    if (!this.selected || this.selected.ticket !== ticket) fail('INVALID');
    await this.reverify(false);
    this.selected!.confirmed = true;
    return { confirmed: true };
  }
  private async reverify(requireConfirmation = true) {
    const selected = this.selected;
    if (!selected || (requireConfirmation && !selected.confirmed)) throw new AppError('INVALID', 'Hãy chọn và xác nhận danh tính TV trước.');
    try {
      const devices = await this.devices();
      if (!devices.some(d => d.serial === selected.serial && d.state === 'device')) fail('DISCONNECTED');
      const actual = await this.identity(selected.serial);
      if (JSON.stringify(actual) !== JSON.stringify(selected.identity)) throw new AppError('INVALID', 'Danh tính thiết bị đã thay đổi. Đã hủy lựa chọn; hãy xác nhận lại TV.');
    } catch (error) { this.clear(); throw error; }
    return selected;
  }
  private async reading<T>(serial: string, command: DeviceCommand, parser: (value: string) => T): Promise<Reading<T>> {
    try { return { available: true, value: parser(await this.read(serial, command)) }; }
    catch (error) {
      if (error instanceof AppError && ['DISCONNECTED', 'UNAUTHORIZED', 'OFFLINE', 'TIMEOUT', 'NETWORK', 'ADB_MISSING'].includes(error.code)) { this.clear(); throw error; }
      return { available: false, reason: error instanceof Error ? error.message : 'Đầu ra không hợp lệ.' };
    }
  }
  async inspect(): Promise<DeviceInfo> {
    const selected = await this.reverify();
    const release = await this.reading(selected.serial, 'release', parseText);
    const api = await this.reading(selected.serial, 'api', parseApi);
    const abi = await this.reading(selected.serial, 'abi', parseText);
    const uptimeSeconds = await this.reading(selected.serial, 'uptime', parseUptime);
    const memory = await this.reading(selected.serial, 'memory', parseMemory);
    const storage = await this.reading(selected.serial, 'storage', parseStorage);
    const launcher = await this.reading(selected.serial, 'launcher', parseLauncher);
    await this.reverify();
    return { identity: selected.identity, release, api, abi, uptimeSeconds, memory, storage, launcher, scannedAt: new Date().toISOString() };
  }
  async inventory(): Promise<Inventory> {
    const selected = await this.reverify();
    try {
      const third = parsePackages(await this.read(selected.serial, 'thirdParty'));
      const system = parsePackages(await this.read(selected.serial, 'system'));
      const disabled = parsePackages(await this.read(selected.serial, 'disabled'));
      const packages = mergePackages(third, system, disabled);
      if (!packages.length) throw new AppError('COMMAND_FAILED', 'Danh sách ứng dụng trống; không thể xác nhận lần quét.');
      await this.reverify();
      return { packages, scannedAt: new Date().toISOString() };
    } catch (error) {
      if (error instanceof AppError && ['DISCONNECTED', 'OFFLINE', 'UNAUTHORIZED', 'TIMEOUT', 'NETWORK'].includes(error.code)) this.clear();
      throw error;
    }
  }
}
