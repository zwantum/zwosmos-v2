import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const localEditorPath = path.join(rootDir, 'src/admin/blog-editor/BlogEditor.tsx');
const targetEditorPath = path.join(rootDir, 'node_modules/@zwantum/blog-editor/src/components/BlogEditor.tsx');

async function patch() {
  if (fs.existsSync(localEditorPath) && fs.existsSync(path.dirname(targetEditorPath))) {
    fs.copyFileSync(localEditorPath, targetEditorPath);
    console.log('[patch-blog-editor] Copied enhanced BlogEditor.tsx to node_modules/@zwantum/blog-editor');
  }

  try {
    const { default: esbuild } = await import('esbuild');
    const entry = path.join(rootDir, 'src/admin/blog-editor/index.ts');
    const tempMjs = path.join(rootDir, 'node_modules/@zwantum/blog-editor/dist/index.temp.mjs');
    const outMjs = path.join(rootDir, 'node_modules/@zwantum/blog-editor/dist/index.mjs');
    const tempCjs = path.join(rootDir, 'node_modules/@zwantum/blog-editor/dist/index.temp.js');
    const outCjs = path.join(rootDir, 'node_modules/@zwantum/blog-editor/dist/index.js');

    await esbuild.build({
      entryPoints: [entry],
      outfile: tempMjs,
      bundle: true,
      format: 'esm',
      external: ['react', 'react-dom', 'react/*', 'react-dom/*', '@tiptap/*', '@zwantum/blog-types', 'lucide-react'],
      loader: { '.tsx': 'tsx', '.ts': 'ts', '.css': 'empty' }
    });

    await esbuild.build({
      entryPoints: [entry],
      outfile: tempCjs,
      bundle: true,
      format: 'cjs',
      external: ['react', 'react-dom', 'react/*', 'react-dom/*', '@tiptap/*', '@zwantum/blog-types', 'lucide-react'],
      loader: { '.tsx': 'tsx', '.ts': 'ts', '.css': 'empty' }
    });

    fs.copyFileSync(tempMjs, outMjs);
    fs.copyFileSync(tempCjs, outCjs);
    fs.unlinkSync(tempMjs);
    fs.unlinkSync(tempCjs);

    console.log('[patch-blog-editor] Successfully compiled @zwantum/blog-editor dist files');
  } catch (err) {
    console.error('[patch-blog-editor] Error bundling blog-editor dist:', err);
  }

}

patch();
