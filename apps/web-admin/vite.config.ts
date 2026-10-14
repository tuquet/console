import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {
      pwa: true,
      pwaOptions: {
        registerType: 'autoUpdate',
        workbox: {
          clientsClaim: true,
          skipWaiting: true,
        },
        manifest: {
          background_color: '#09090b',
          description:
            'Tuquet Admin - Unified Management & Operations Console (admin.tuquet.com)',
          display: 'standalone',
          icons: [
            {
              sizes: '192x192',
              src: '/pwa-192x192.png',
              type: 'image/png',
            },
            {
              sizes: '512x512',
              src: '/pwa-512x512.png',
              type: 'image/png',
            },
            {
              purpose: 'any maskable',
              sizes: '512x512',
              src: '/pwa-512x512.png',
              type: 'image/png',
            },
          ],
          name: 'Tuquet Admin',
          short_name: 'Tuquet Admin',
          theme_color: '#09090b',
        },
      },
    },
    vite: {
      plugins: [],
      resolve: {
        dedupe: ['vue', 'vue-router', 'pinia'],
      },
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // Mock proxy target URL
            target: 'http://localhost:5320/api',
            ws: true,
          },
        },
      },
    },
  };
});
