import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      alias: [
        {
          find: /^@zwantum\/blog-editor$/,
          replacement: path.resolve(process.cwd(), 'src/admin/blog-editor/index.ts')
        }
      ]
    },
    optimizeDeps: {
      exclude: ['@zwantum/blog', '@zwantum/blog-admin', '@zwantum/blog-editor']
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('three') || id.includes('@react-three')) {
                return 'vendor-three';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }
              if (id.includes('@tiptap')) {
                return 'vendor-tiptap';
              }
            }
          }
        }
      }
    }
  }
})