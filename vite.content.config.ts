import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Content scripts cannot be ES modules in MV3 content_scripts manifest entries,
// so we build the content script as an IIFE in a separate Vite invocation.
export default defineConfig({
  publicDir: false,
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    target: 'es2022',
    minify: false,
    lib: {
      entry: resolve(__dirname, 'src/content/index.ts'),
      formats: ['iife'],
      name: 'RobinhoodExporterContent',
      fileName: () => 'content/index.js',
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
});
