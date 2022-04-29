import { fileURLToPath, URL } from 'url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.ELECTRON == 'true' ? './' : '',
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    quasar({
      sassVariables: 'src/styles/variables',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Applies to the DEV Server
    proxy: {
      // Used to proxy requests to the k8s proxy in order to prevent CORS issues
      '/k8s': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/k8s/, ''),
      },
    },
  },
  test: {
    environment: 'happy-dom',
  },
});
