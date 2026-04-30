import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3878,
      host: '0.0.0.0',
      hmr: { port: 3878 },
      allowedHosts: true,
      proxy: {
        '/api': {
          target: `http://localhost:${env.API_PORT || 4000}`,
          changeOrigin: true,
        },
        '/r2': {
          target: 'https://pub-e12eb7874b084e1da7840ee4870ec95f.r2.dev',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/r2/, ''),
        },
        '/ws': {
          target: `ws://localhost:${env.API_PORT || 4000}`,
          ws: true,
          rewrite: (path) => path.replace(/^\/ws/, ''),
        },
      },
    },
    plugins: [react()],
    define: {
      // API keys were removed
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
