import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const localEditorPath = path.join(rootDir, 'src/admin/blog-editor/BlogEditor.tsx');
const targetEditorPath = path.join(rootDir, 'node_modules/@zwantum/blog-editor/src/components/BlogEditor.tsx');

if (fs.existsSync(localEditorPath) && fs.existsSync(path.dirname(targetEditorPath))) {
  fs.copyFileSync(localEditorPath, targetEditorPath);
  console.log('[patch-blog-editor] Copied enhanced BlogEditor.tsx to node_modules/@zwantum/blog-editor');
}
