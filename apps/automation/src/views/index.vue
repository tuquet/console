<script lang="ts" setup>
import { computed } from 'vue';

import { useKernel } from '@operon/kernel';

import { Badge, Button, toast } from '@operon-core/shadcn-ui';

import { CheckCircle2, Cloud, Cpu, Layers, Sparkles } from '@lucide/vue';

import { useSampleStore } from '../stores/sample';

defineOptions({ name: 'AutomationStarterView' });

const kernel = useKernel();
const sampleStore = useSampleStore();

const isCloud = computed(() => kernel.auth.hasCloudAuth);

function handleNotify() {
  const msg = `Notification triggered from Micro-App! Counter: ${sampleStore.counter}`;
  kernel.events.notify('success', msg);
  toast.success(msg);
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
            Automation Micro-App
          </h2>
          <Badge
            variant="outline"
            :class="
              isCloud
                ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                : 'border-zinc-500/30 text-zinc-400 bg-zinc-500/10'
            "
            class="text-xs px-2 py-0.5"
          >
            <Cloud v-if="isCloud" class="size-3 mr-1" />
            <Cpu v-else class="size-3 mr-1" />
            {{ isCloud ? 'Cloud Synced' : 'Local / Standalone Mode' }}
          </Badge>
        </div>
        <p class="text-sm text-muted-foreground mt-1">
          Clean Micro-Frontend Boilerplate running independently or mounted in
          Host Shell.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button size="sm" variant="outline" @click="handleNotify">
          <Sparkles class="size-3.5 mr-1.5" />
          Test Shell Toast
        </Button>
      </div>
    </div>

    <!-- Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <!-- Kernel Context Card -->
      <div class="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div class="flex items-center justify-between pb-3">
          <h3 class="text-sm font-semibold text-foreground">Kernel Context</h3>
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
            <span>Username:</span>
            <span class="font-mono text-foreground">{{
              kernel.auth.username || 'operator'
            }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-border/30">
            <span>Cloud Auth:</span>
            <span
              :class="isCloud ? 'text-emerald-500' : 'text-zinc-400'"
              class="font-medium"
            >
              {{ isCloud ? 'Authenticated' : 'Offline / Local' }}
            </span>
          </div>
          <div class="flex justify-between py-1">
            <span>Roles:</span>
            <span class="font-mono text-foreground">{{
              kernel.auth.roles?.join(', ') || 'local_operator'
            }}</span>
          </div>
        </div>
      </div>

      <!-- Local Pinia Store Card -->
      <div class="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div class="flex items-center justify-between pb-3">
          <h3 class="text-sm font-semibold text-foreground">
            Local Micro-Store (Pinia)
          </h3>
          <Badge variant="secondary" class="text-xs font-mono">
            automation:sample
          </Badge>
        </div>
        <p class="text-xs text-muted-foreground mb-4">
          State is completely isolated and namespaced. When embedded, it joins
          the Shell Pinia tree without ID collisions.
        </p>
        <div class="flex items-center gap-3">
          <div
            class="text-2xl font-bold font-mono px-3 py-1 bg-muted rounded-md"
          >
            {{ sampleStore.counter }}
          </div>
          <Button size="sm" @click="sampleStore.increment"> Increment </Button>
          <Button size="sm" variant="ghost" @click="sampleStore.reset">
            Reset
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
