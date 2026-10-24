import { createServer, type IncomingMessage } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { AppError, validAdbPath, type Runner } from '../../shared/src/index.js';
import { RealRunner } from './adb/runner.js';
import { discoverAdb } from './adb/discovery.js';
import { InspectionService } from './service.js';

const hosts = new Set(['127.0.0.1:4317', '127.0.0.1:5173']);
const origins = new Set(['http://127.0.0.1:4317', 'http://127.0.0.1:5173']);
export function allowedRequest(host: string | undefined, origin: string | undefined): boolean {
  return Boolean(host && hosts.has(host) && (!origin || origins.has(origin)));
}
async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  let size = 0; const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk as Uint8Array); size += buffer.length;
    if (size > 4096) throw new AppError('INVALID', 'Yêu cầu vượt giới hạn kích thước.');
    chunks.push(buffer);
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, unknown>;
  } catch { throw new AppError('INVALID', 'Nội dung JSON không hợp lệ.'); }
}
export function createApp(options: { runnerFactory?: (path: string) => Runner; discover?: () => Promise<string[]>; frontendDir?: string } = {}) {
  const token = randomBytes(32).toString('hex');
  let service: InspectionService | null = null;
  let configuredPath: string | null = null;
  let configuring = false;
  return createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const json = (status: number, value: unknown) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value));
    };
    if (!allowedRequest(req.headers.host, req.headers.origin) || (req.headers['sec-fetch-site'] === 'cross-site')) return json(403, { error: 'Nguồn hoặc Host không được phép.' });
    const url = new URL(req.url ?? '/', 'http://127.0.0.1:4317');
    try {
      if (url.pathname === '/api/bootstrap' && req.method === 'GET') return json(200, { token, candidates: await (options.discover ?? discoverAdb)(), configuredPath, mode: 'READ ONLY' });
      if (url.pathname.startsWith('/api/')) {
        if (req.method !== 'POST') return json(405, { error: 'Phương thức không được hỗ trợ.' });
        const supplied = req.headers['x-session-token'];
        if (typeof supplied !== 'string' || supplied.length !== token.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))) return json(403, { error: 'Phiên không hợp lệ. Hãy tải lại trang.' });
        if (req.headers['content-type'] !== 'application/json') return json(415, { error: 'Yêu cầu phải là application/json.' });
        const input = await body(req);
        if (url.pathname === '/api/adb/configure') {
          if (!validAdbPath(input.path)) throw new AppError('INVALID', 'Đường dẫn phải là đường dẫn Windows tuyệt đối tới adb.exe.');
          if (configuring) throw new AppError('INVALID', 'Đang kiểm tra ADB. Vui lòng chờ.');
          configuring = true;
          try {
            if (service) await service.exclusive(async () => { service!.clear(); service = null; configuredPath = null; });
            const runner = (options.runnerFactory ?? (p => new RealRunner(p)))(input.path);
            const version = await runner.run({ kind: 'version' });
            if (version.exitCode !== 0 || !/^Android Debug Bridge version \d+\.\d+\.\d+/m.test(version.stdout)) throw new AppError('ADB_MISSING', 'Không xác minh được phiên bản ADB. Hãy chọn Platform-Tools chính thức.');
            service = new InspectionService(runner); configuredPath = input.path;
            return json(200, { version: version.stdout.trim() });
          } finally { configuring = false; }
        }
        if (!service || configuring) throw new AppError('ADB_MISSING', 'Hãy chọn và kiểm tra đường dẫn ADB trước.');
        const active = service;
        const result = await active.exclusive(async () => {
          switch (url.pathname) {
            case '/api/devices': return { devices: await active.devices() };
            case '/api/select': return active.select(input.serial);
            case '/api/confirm': return active.confirm(input.ticket);
            case '/api/inspect': return active.inspect();
            case '/api/packages': return active.inventory();
            default: return null;
          }
        });
        return result === null ? json(404, { error: 'Không có chức năng này trong Phase 1.' }) : json(200, result);
      }
      if (req.method !== 'GET' || !options.frontendDir) return json(404, { error: 'Không tìm thấy trang.' });
      const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const root = path.resolve(options.frontendDir);
      const target = path.resolve(root, relative || 'index.html');
      if (target !== root && !target.startsWith(root + path.sep)) return json(403, { error: 'Đường dẫn không được phép.' });
      const ext = path.extname(target);
      const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
      if (!mime[ext]) return json(404, { error: 'Không tìm thấy tệp.' });
      const bytes = await readFile(target);
      res.writeHead(200, { 'Content-Type': mime[ext] }); res.end(bytes);
    } catch (error) {
      const appError = error instanceof AppError;
      json(400, { error: appError ? error.message : error instanceof Error && !('code' in error) ? error.message : 'Không đọc được dữ liệu. Kiểm tra đường dẫn và kết nối.', code: appError ? error.code : 'COMMAND_FAILED' });
    }
  });
}
