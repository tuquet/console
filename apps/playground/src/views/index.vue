<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useKernel } from '@operon/kernel';

import {
  Badge,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@operon-core/shadcn-ui';

import {
  CheckCircle2,
  Cloud,
  Cpu,
  Layers,
  ListTodo,
  Sparkles,
} from '@lucide/vue';

import { usePlaygroundStore } from '../stores/sample';
import { columns } from '../tasks/components/columns';
import DataTable from '../tasks/components/DataTable.vue';
import UserNav from '../tasks/components/UserNav.vue';
import tasksData from '../tasks/data/tasks.json';

defineOptions({ name: 'PlaygroundOverviewView' });

const kernel = useKernel();
const store = usePlaygroundStore();
const activeTab = ref('tasks');

const isCloud = computed(() => kernel.auth.hasCloudAuth);

function handleNotify() {
  const msg = `Notification from @operon/playground! Tasks count: ${tasksData.length}`;
  kernel.events.notify('success', msg);
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-5"
    >
      <div>
        <div class="flex items-center gap-2.5">
          <Layers class="size-6 text-primary" />
          <h2 class="text-xl font-semibold tracking-tight">
            Playground & Component Showcase
          </h2>
          <Badge
            variant="outline"
            class="text-xs px-2 py-0.5"
            :class="
              isCloud
                ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                : 'border-zinc-500/30 text-zinc-400 bg-zinc-500/10'
            "
          >
            <Cloud v-if="isCloud" class="size-3 mr-1" />
            <Cpu v-else class="size-3 mr-1" />
            {{ isCloud ? 'Cloud Synced' : 'Local Standalone' }}
          </Badge>
        </div>
        <p class="text-sm text-muted-foreground mt-1">
          Tham khảo & phát triển nhanh các UI Pattern từ shadcn-vue (Tasks
          Table, TanStack Table v9, Customizer).
        </p>
      </div>

      <div class="flex items-center gap-3">
        <UserNav />
        <Button size="sm" variant="outline" @click="handleNotify">
          <Sparkles class="size-3.5 mr-1.5" />
          Notify Shell
        </Button>
      </div>
    </div>

    <!-- Main Navigation Tabs -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="mb-4">
        <TabsTrigger value="tasks" class="flex items-center gap-2">
          <ListTodo class="size-4" />
          <span>Tasks Data Table (TanStack v9)</span>
        </TabsTrigger>
        <TabsTrigger value="overview" class="flex items-center gap-2">
          <Layers class="size-4" />
          <span>Micro-App Architecture</span>
        </TabsTrigger>
      </TabsList>

      <!-- Tab: Tasks Table -->
      <TabsContent value="tasks" class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-medium">Tasks Management</h3>
            <p class="text-sm text-muted-foreground">
              Ví dụ hoàn chỉnh Data Table với TanStack Table v9, Faceted Filter,
              Sorting, Pagination và Column Toggles.
            </p>
          </div>
        </div>

        <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
          <DataTable :columns="columns" :data="tasksData" />
        </div>
      </TabsContent>

      <!-- Tab: Micro-App Context -->
      <TabsContent value="overview" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div class="flex items-center justify-between pb-3">
              <h3 class="text-sm font-semibold text-foreground">
                Kernel Context
              </h3>
              <CheckCircle2 class="size-4 text-emerald-500" />
            </div>
            <div class="flex flex-col gap-2 text-xs text-muted-foreground">
              <div class="flex justify-between py-1 border-b border-border/30">
                <span>User ID:</span>
                <span class="font-mono text-foreground">{{
                  kernel.auth.userId || 'N/A'
                }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-border/30">
                <span>Tenant ID:</span>
                <span class="font-mono text-foreground">{{
                  kernel.auth.tenantId || 'N/A'
                }}</span>
              </div>
              <div class="flex justify-between py-1">
                <span>Roles:</span>
                <span class="font-mono text-foreground">{{
                  kernel.auth.roles.join(', ')
                }}</span>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div class="flex items-center justify-between pb-3">
              <h3 class="text-sm font-semibold text-foreground">
                Scoped Store
              </h3>
              <Badge variant="secondary" class="text-xs">
                Namespace: playground
              </Badge>
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted-foreground"
                  >Counter value:</span
                >
                <span class="text-xl font-bold font-mono">{{
                  store.counter
                }}</span>
              </div>
              <Button size="sm" @click="store.increment">
                Increment Counter
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
