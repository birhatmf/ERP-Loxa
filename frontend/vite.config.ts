import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 4050,
    host: true,
    allowedHosts: ['pinksistem.store'],
    proxy: {
      '/api': 'http://localhost:4051',
    },
  },
});
