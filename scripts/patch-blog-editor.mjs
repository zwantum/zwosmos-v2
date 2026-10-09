import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const localEditorPath = path.join(rootDir, 'src/admin/blog-editor/BlogEditor.tsx');
const targetEditorPath = path.join(rootDir, 'node_modules/@zwantum/blog-editor/src/components/BlogEditor.tsx');

async function patch() {
  // Sync modified components and extensions to node_modules/@zwantum/blog-editor/src
  if (fs.existsSync(localEditorPath) && fs.existsSync(path.dirname(targetEditorPath))) {
    let code = fs.readFileSync(localEditorPath, 'utf8');
    code = code
      .replace(/['"]\.\/EditorToolbar['"]/g, "'./EditorToolbar'")
      .replace(/['"]\.\/extensions['"]/g, "'../extensions'")
      .replace(/['"]\.\/hooks\/useAutosave['"]/g, "'../hooks/useAutosave'")
      .replace(/['"]@zwantum\/blog-editor\/styles\.css['"]/g, "'../styles/editor.css'")
      .replace(/['"]@zwantum\/blog-editor\/content\.css['"]/g, "'../styles/content.css'");
    fs.writeFileSync(targetEditorPath, code, 'utf8');
  }

  const localToolbarPath = path.join(rootDir, 'src/admin/blog-editor/EditorToolbar.tsx');
  const targetToolbarPath = path.join(rootDir, 'node_modules/@zwantum/blog-editor/src/components/EditorToolbar.tsx');
  if (fs.existsSync(localToolbarPath) && fs.existsSync(path.dirname(targetToolbarPath))) {
    fs.copyFileSync(localToolbarPath, targetToolbarPath);
  }

  const localModalPath = path.join(rootDir, 'src/admin/blog-editor/EditorModal.tsx');
  const targetModalPath = path.join(rootDir, 'node_modules/@zwantum/blog-editor/src/components/EditorModal.tsx');
  if (fs.existsSync(localModalPath) && fs.existsSync(path.dirname(targetModalPath))) {
    fs.copyFileSync(localModalPath, targetModalPath);
  }

  const localExtDir = path.join(rootDir, 'src/admin/blog-editor/extensions');
  const targetExtDir = path.join(rootDir, 'node_modules/@zwantum/blog-editor/src/extensions');
  if (fs.existsSync(localExtDir) && fs.existsSync(targetExtDir)) {
    fs.cpSync(localExtDir, targetExtDir, { recursive: true });
  }

  const localBlogContentPath = path.join(rootDir, 'src/ui/BlogContent.tsx');
  const targetBlogContentPath = path.join(rootDir, 'node_modules/@zwantum/blog-react/src/components/BlogContent.tsx');
  if (fs.existsSync(localBlogContentPath) && fs.existsSync(path.dirname(targetBlogContentPath))) {
    fs.copyFileSync(localBlogContentPath, targetBlogContentPath);
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

    const dtsPath = path.join(rootDir, 'node_modules/@zwantum/blog-editor/dist/index.d.ts');
    if (fs.existsSync(dtsPath)) {
      let dts = fs.readFileSync(dtsPath, 'utf8');
      dts = dts.replace(/insertImage: \(src: string, alt\?: string\) => void;/g, 'insertImage: (src: string, alt?: string, caption?: string) => void;');
      fs.writeFileSync(dtsPath, dts, 'utf8');
    }

    console.log('[patch-blog-editor] Successfully compiled @zwantum/blog-editor dist files with Citation support');

    // Also compile @zwantum/blog-react dist files with Citation support
    const reactEntry = path.join(rootDir, 'node_modules/@zwantum/blog-react/src/index.ts');
    const reactOutMjs = path.join(rootDir, 'node_modules/@zwantum/blog-react/dist/index.mjs');
    const reactOutCjs = path.join(rootDir, 'node_modules/@zwantum/blog-react/dist/index.js');
    if (fs.existsSync(reactEntry)) {
      await esbuild.build({
        entryPoints: [reactEntry],
        outfile: reactOutMjs,
        bundle: true,
        format: 'esm',
        external: ['react', 'react-dom', 'react/*', 'react-dom/*', '@zwantum/blog-core', '@zwantum/blog-types'],
        loader: { '.tsx': 'tsx', '.ts': 'ts' }
      });
      await esbuild.build({
        entryPoints: [reactEntry],
        outfile: reactOutCjs,
        bundle: true,
        format: 'cjs',
        external: ['react', 'react-dom', 'react/*', 'react-dom/*', '@zwantum/blog-core', '@zwantum/blog-types'],
        loader: { '.tsx': 'tsx', '.ts': 'ts' }
      });
      console.log('[patch-blog-editor] Successfully compiled @zwantum/blog-react dist files with Citation support');
    }

    // Also compile @zwantum/blog-admin dist files
    const adminEntry = path.join(rootDir, 'node_modules/@zwantum/blog-admin/src/index.ts');
    const adminOutMjs = path.join(rootDir, 'node_modules/@zwantum/blog-admin/dist/index.mjs');
    const adminOutCjs = path.join(rootDir, 'node_modules/@zwantum/blog-admin/dist/index.js');
    if (fs.existsSync(adminEntry)) {
      await esbuild.build({
        entryPoints: [adminEntry],
        outfile: adminOutMjs,
        bundle: true,
        format: 'esm',
        external: ['react', 'react-dom', 'react/*', 'react-dom/*', '@zwantum/blog-core', '@zwantum/blog-types', '@zwantum/blog-editor', '@zwantum/blog-seo', 'lucide-react'],
        loader: { '.tsx': 'tsx', '.ts': 'ts', '.css': 'empty' }
      });
      await esbuild.build({
        entryPoints: [adminEntry],
        outfile: adminOutCjs,
        bundle: true,
        format: 'cjs',
        external: ['react', 'react-dom', 'react/*', 'react-dom/*', '@zwantum/blog-core', '@zwantum/blog-types', '@zwantum/blog-editor', '@zwantum/blog-seo', 'lucide-react'],
        loader: { '.tsx': 'tsx', '.ts': 'ts', '.css': 'empty' }
      });
      console.log('[patch-blog-editor] Successfully compiled @zwantum/blog-admin dist files');
    }
  } catch (err) {
    console.error('[patch-blog-editor] Error bundling dist files:', err);
  }
}

patch();
