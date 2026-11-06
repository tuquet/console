<script setup lang="ts">
import { useRouter } from 'vue-router';

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@operon-core/shadcn-ui';

import { $t } from '#/locales';

defineOptions({ name: 'TitlebarMenubar' });

const router = useRouter();

function go(path: string) {
  router.push(path);
}

interface MenuEntry {
  path: string;
  label: () => string;
  separator?: boolean;
}

interface MenuGroup {
  label: () => string;
  items: MenuEntry[];
}

const menus: MenuGroup[] = [
  {
    label: () => $t('page.dashboard.title'),
    items: [
      {
        path: '/dashboard/analytics',
        label: () => $t('page.dashboard.analytics'),
      },
    ],
  },
  {
    label: () => $t('page.automation.title'),
    items: [
      {
        path: '/automation/overview',
        label: () => $t('page.automation.overview'),
      },
      {
        path: '/automation/workflows',
        label: () => $t('page.automation.workflows'),
      },
      {
        path: '/automation/devices',
        label: () => $t('page.automation.devices'),
      },
      {
        path: '/automation/browsers',
        label: () => $t('page.automation.browsers'),
      },
    ],
  },
  {
    label: () => $t('page.commerce.title'),
    items: [
      { path: '/commerce/store', label: () => $t('page.commerce.store') },
      { path: '/commerce/orders', label: () => $t('page.commerce.orders') },
      { path: '/commerce/wallet', label: () => $t('page.commerce.wallet') },
      {
        separator: true,
        path: '/commerce/admin',
        label: () => $t('page.commerce.admin'),
      },
    ],
  },
  {
    label: () => $t('page.system.title'),
    items: [
      { path: '/system/overview', label: () => $t('page.system.overview') },
      { path: '/system/plugins', label: () => $t('page.system.plugins') },
      { path: '/system/users', label: () => $t('page.system.users') },
      {
        separator: true,
        path: '/system/plans',
        label: () => $t('page.system.plans'),
      },
      { path: '/system/audit-logs', label: () => $t('page.system.auditLogs') },
    ],
  },
];
</script>

<template>
  <Menubar
    class="h-full border-none bg-transparent p-0 shadow-none"
    @dblclick.stop
  >
    <MenubarMenu v-for="group in menus" :key="group.label()">
      <MenubarTrigger
        class="h-7 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground data-[state=open]:text-foreground"
      >
        {{ group.label() }}
      </MenubarTrigger>
      <MenubarContent class="min-w-[160px]">
        <template v-for="item in group.items" :key="item.path">
          <MenubarSeparator v-if="item.separator" />
          <MenubarItem @select="go(item.path)">
            {{ item.label() }}
          </MenubarItem>
        </template>
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
</template>
