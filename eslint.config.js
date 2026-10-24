import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '.npm-cache/**', '.browser-cache/**', 'coverage/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  { files: ['**/*.ts', '**/*.tsx'], rules: {
    'no-restricted-imports': ['error', { paths: ['child_process', 'node:child_process'] }],
    'no-control-regex': 'off'
  } },
  { files: ['packages/backend/src/adb/runner.ts'], rules: { 'no-restricted-imports': 'off' } }
);
