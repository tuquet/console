import { defineConfig } from '@operon/vite-config';

export default defineConfig(async () => {
  return {
    application: {
      html: true,
      pwa: false,
    },
    vite: {
      server: {
        host: true,
        port: 5321,
      },
    },
  };
});
