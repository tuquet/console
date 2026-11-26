import { automationManifest } from '@operon/automation';

import { defineMicroAppRouteModule } from '../micro-app-route';

export default defineMicroAppRouteModule({
  appId: 'automation',
  manifest: automationManifest,
  meta: {
    hideInMenu: true,
    platform: 'all',
    plugin: 'operon',
  },
  name: 'Automation',
});
