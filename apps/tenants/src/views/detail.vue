<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useKernel } from '@operon/kernel';

import { Badge, Button, Card } from '@operon-core/shadcn-ui';

import { ArrowLeft, Building2, Key, ShieldCheck, Users } from '@lucide/vue';

import { useTenantsStore } from '../stores/sample';

defineOptions({ name: 'TenantDetailStarterView' });

const route = useRoute();
const router = useRouter();
const kernel = useKernel();
const tenantsStore = useTenantsStore();

const workspaceId = computed(() => (route.params.id as string) || 'ws-default');
const workspace = computed(() => {
  return (
    tenantsStore.workspaces.find((w) => w.id === workspaceId.value) || {
      id: workspaceId.value,
      name: 'Custom Workspace',
      slug: 'custom',
      tier: 'pro' as const,
      memberCount: 1,
    }
  );
});

function goBack() {
  router.push('/tenants');
}

function notifyShell(
  type: 'error' | 'info' | 'success' | 'warning',
  message: string,
) {
  kernel.events.notify(type, message);
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex items-center gap-4">
      <Button variant="outline" size="sm" class="gap-1.5" @click="goBack">
        <ArrowLeft class="size-4" />
        Back to Workspaces
      </Button>
      <div>
        <h1 class="text-xl font-bold tracking-tight text-foreground">
          Workspace: {{ workspace.name }}
        </h1>
        <p class="text-xs text-muted-foreground font-mono">
          ID: {{ workspace.id }} | Slug: {{ workspace.slug }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card class="border-border bg-card p-5 flex flex-col gap-3">
        <div class="flex items-center gap-2 text-primary font-semibold text-sm">
          <Building2 class="size-4" />
          <span>Workspace Plan & Tier</span>
        </div>
        <div class="flex items-center gap-2">
          <Badge variant="default" class="text-xs capitalize">
            {{ workspace.tier }} Plan
          </Badge>
          <span class="text-xs text-muted-foreground"
            >Unlimited automations</span
          >
        </div>
      </Card>

      <Card class="border-border bg-card p-5 flex flex-col gap-3">
        <div class="flex items-center gap-2 text-primary font-semibold text-sm">
          <Users class="size-4" />
          <span>Active Team Members</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-2xl font-bold text-foreground">{{
            workspace.memberCount
          }}</span>
          <span class="text-xs text-muted-foreground">seats occupied</span>
        </div>
      </Card>

      <Card class="border-border bg-card p-5 flex flex-col gap-3">
        <div class="flex items-center gap-2 text-primary font-semibold text-sm">
          <Key class="size-4" />
          <span>Security & API Access</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          class="w-full text-xs gap-1.5"
          @click="
            notifyShell('info', 'Rotated API credentials (Boilerplate stub)')
          "
        >
          <ShieldCheck class="size-3.5 text-emerald-500" />
          Rotate API Key
        </Button>
      </Card>
    </div>
  </div>
</template>
