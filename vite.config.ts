import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const root = __dirname;

export default defineConfig({
  root: resolve(root, 'src'),
  publicDir: resolve(root, 'public'),
  build: {
    outDir: resolve(root, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
    minify: false,
    rollupOptions: {
      input: {
        popup: resolve(root, 'src/popup/index.html'),
        background: resolve(root, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') return 'background/index.js';
          return 'popup/[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (info) => {
          const name = info.names?.[0] ?? '';
          if (name.endsWith('.css')) return 'popup/[name][extname]';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
