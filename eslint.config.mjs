import { defineConfig } from '@vben/eslint-config';

export default defineConfig([
  {
    files: ['**/*.vue'],
    rules: {
      'vue/html-closing-bracket-newline': 'off',
    },
  },
]);
