import { playgroundManifest } from '@operon/playground';

import { defineMicroAppRouteModule } from '../micro-app-route';

export default defineMicroAppRouteModule({
  appId: 'playground',
  manifest: playgroundManifest,
  meta: {
    platform: 'all',
    plugin: 'operon',
  },
  name: 'Playground',
});
