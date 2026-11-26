import { workspacesManifest } from '@operon/workspaces';

import { defineMicroAppRouteModule } from '../micro-app-route';

export default defineMicroAppRouteModule({
  appId: 'workspaces',
  manifest: workspacesManifest,
  meta: {
    authority: ['superadmin', 'workspaces:read'],
    hideChildrenInMenu: true,
    platform: 'all',
    plugin: 'identity',
    requiresCloud: true,
  },
  name: 'WorkspacesRoot',
  redirectToDefault: false,
});
