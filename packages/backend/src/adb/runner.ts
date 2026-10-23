import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { commandArgs, validAdbPath, fail, AppError, errorMessages, type Runner, type AdbCommand, type AdbResult } from '../../../shared/src/index.js';

export class RealRunner implements Runner {
  constructor(private readonly executable: string, private readonly timeoutMs = 12000) {}
  async run(command: AdbCommand): Promise<AdbResult> {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.VITEST_WORKER_ID) {
      throw new Error('Real ADB runner is forbidden under tests');
    }
    const args = commandArgs(command);
    if (!validAdbPath(this.executable)) fail('INVALID');
    try { await access(this.executable); } catch { fail('ADB_MISSING'); }
    return new Promise((resolve, reject) => {
      const child = spawn(this.executable, args, {
        shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, ADB_SERVER_SOCKET: 'tcp:127.0.0.1:5037', ANDROID_ADB_SERVER_ADDRESS: '127.0.0.1', ANDROID_ADB_SERVER_PORT: '5037' }
      });
      let stdout = ''; let stderr = ''; let size = 0; let settled = false;
      const finish = (error?: Error, result?: AdbResult) => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        if (error) reject(error); else resolve(result!);
      };
      const timer = setTimeout(() => {
        child.kill(); finish(new AppError('TIMEOUT', errorMessages.TIMEOUT));
      }, this.timeoutMs);
      const collect = (chunk: Buffer, stream: 'stdout' | 'stderr') => {
        size += chunk.length;
        if (size > 4 * 1024 * 1024) {
          child.kill(); finish(new AppError('COMMAND_FAILED', 'Đầu ra vượt giới hạn an toàn; đã dừng đọc.')); return;
        }
        if (stream === 'stdout') stdout += chunk.toString('utf8'); else stderr += chunk.toString('utf8');
      };
      child.stdout.on('data', (chunk: Buffer) => collect(chunk, 'stdout'));
      child.stderr.on('data', (chunk: Buffer) => collect(chunk, 'stderr'));
      child.on('error', () => finish(new AppError('ADB_MISSING', errorMessages.ADB_MISSING)));
      child.on('close', code => finish(undefined, { stdout, stderr, exitCode: code ?? -1 }));
    });
  }
}
