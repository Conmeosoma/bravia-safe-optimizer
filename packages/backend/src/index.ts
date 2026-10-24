import { fileURLToPath } from 'node:url';
import { createApp } from './server.js';

// Both source and compiled entry points resolve the same frontend workspace.
const frontendDir = fileURLToPath(new URL(import.meta.url.includes('/dist/') ? '../../../../frontend/dist/' : '../../frontend/dist/', import.meta.url));
const server = createApp({ frontendDir });
server.listen(4317, '127.0.0.1', () => {
  console.log('Sony BRAVIA Safe Optimizer — READ ONLY — http://127.0.0.1:4317');
});
server.on('error', () => { console.error('Không mở được máy chủ nội bộ. Kiểm tra cổng 4317 có đang được sử dụng không.'); process.exitCode = 1; });
