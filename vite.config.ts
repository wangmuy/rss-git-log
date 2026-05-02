import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
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
  test: {
    environment: 'jsdom',
    globals: false
  }
});
