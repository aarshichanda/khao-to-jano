import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// MASTER PROXY CONFIGURATION: Routes all frontend /api network paths straight to the IPv4 backend tunnel
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', // Enforces explicit IPv4 local binding layout
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', // Points cleanly to your Node Express listening engine
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
