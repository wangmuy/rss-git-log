import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const base = process.env.VITE_BASE || '/';

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
  build: {
    target: 'es2020',
    minify: 'esbuild', // Use esbuild instead of terser (built-in)
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    exclude: ['@electric-sql/pglite']
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts']
  }
});
