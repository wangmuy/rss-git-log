import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const base = process.env.VITE_BASE || '/';

export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  assetsInclude: ['**/*.wasm', '**/*.data'],
  build: {
    target: 'es2018',
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
