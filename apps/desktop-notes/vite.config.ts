import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: process.env.ELECTRON_DEV ? '/' : './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: [
      'lucide-react',
      '@tiptap/extension-list',
      '@tiptap/extension-subscript',
      '@tiptap/extension-superscript',
      '@tiptap/extension-table',
      '@tiptap/extension-table-row',
      '@tiptap/extension-table-cell',
      '@tiptap/extension-table-header',
      '@tiptap/extension-color',
      '@tiptap/extension-text-style',
      '@tiptap/extension-code-block-lowlight',
      '@tiptap/extensions',
      '@tiptap/react/menus',
      'lowlight'
    ]
  }
});
