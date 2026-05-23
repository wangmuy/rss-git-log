import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const base = process.env.VITE_BASE || '/';
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'node-stubs',
      resolveId(id) {
        if (id === 'fs' || id === 'fs/promises' || id === 'path' || id === 'path/posix') {
          return { id: '/src/stubs/fs-path.ts' };
        }
        if (id.includes('__vite-browser-external')) {
          return { id: '/src/stubs/browser-external.ts' };
        }
        return null;
      }
    },
    {
      name: 'vite-base-marker',
      closeBundle() {
        writeFileSync(resolve(__dirname, 'dist', '.vite-base'), base, 'utf-8');
      }
    }
  ],
  base,
  resolve: {
    alias: {
      '@': '/src',
    }
  },
  optimizeDeps: {
    exclude: ['@electric-sql/pglite']
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled']
        }
      },
      onwarn(warning, warn) {
        if (warning.code === 'EVAL') return;
        if (warning.message.includes('__vite-browser-external')) return;
        warn(warning);
      }
    }
  },
  assetsInclude: ['**/*.wasm', '**/*.data'],
  server: {
    port: 3000,
    open: true
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts']
  }
});