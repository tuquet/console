import { createApp, watchEffect } from 'vue';

import { registerAccessDirective } from '@vben/access';
import { registerLoadingDirective } from '@vben/common-ui/es/loading';
import { preferences } from '@vben/preferences';
import { initStores } from '@vben/stores';
import '@vben/styles';

import { useTitle } from '@vueuse/core';

import { $t, setupI18n } from '#/locales';

import { initComponentAdapter } from './adapter/component';
import { initSetupVbenForm } from './adapter/form';
import App from './app.vue';
import { router } from './router';

import '@tuquet/vue-ui/style.css';

async function bootstrap(namespace: string) {
  // Initialize component adapter
  await initComponentAdapter();

  // Initialize form components
  await initSetupVbenForm();

  // Set default modal configuration
  // setDefaultModalProps({
  //   fullscreenButton: false,
  // });
  // Set default drawer configuration
  // setDefaultDrawerProps({
  //   zIndex: 1020,
  // });

  const app = createApp(App);

  // Register v-loading directive
  registerLoadingDirective(app, {
    loading: 'loading', // Customize directive name here or provide false to omit registration
    spinning: 'spinning',
  });

  // Setup internationalization (i18n)
  await setupI18n(app);

  // Configure Pinia store
  await initStores(app, { namespace });

  // Register access control directives
  registerAccessDirective(app);

  // Initialize Tippy
  const { initTippy } = await import('@vben/common-ui/es/tippy');
  initTippy(app);

  // Configure router and guards
  app.use(router);

  // Configure Motion plugin
  const { MotionPlugin } = await import('@vben/plugins/motion');
  app.use(MotionPlugin);

  // Dynamically update document title
  watchEffect(() => {
    if (preferences.app.dynamicTitle) {
      const routeTitle = router.currentRoute.value.meta?.title;
      const translatedTitle =
        typeof routeTitle === 'string' ? $t(routeTitle) : '';
      const pageTitle =
        (translatedTitle ? `${translatedTitle} - ` : '') + preferences.app.name;
      useTitle(pageTitle);
    }
  });

  app.mount('#app');
}

export { bootstrap };
