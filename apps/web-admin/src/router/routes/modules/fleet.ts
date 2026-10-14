import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      hideInMenu: true,
      title: '',
    },
    name: 'FleetLegacy',
    path: '/fleet',
    redirect: '/automation/devices',
    children: [
      {
        name: 'FleetDevicesRedirect',
        path: 'devices',
        redirect: '/automation/devices',
        meta: {
          hideInMenu: true,
          title: '',
        },
      },
      {
        name: 'FleetBrowsersRedirect',
        path: 'browsers',
        redirect: '/automation/browsers',
        meta: {
          hideInMenu: true,
          title: '',
        },
      },
      {
        name: 'FleetProxiesRedirect',
        path: 'proxies',
        redirect: '/automation/proxies',
        meta: {
          hideInMenu: true,
          title: '',
        },
      },
    ],
  },
];

export default routes;
