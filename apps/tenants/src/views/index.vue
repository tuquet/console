<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { useKernel } from '@operon/kernel';

import { Badge, Button, Card } from '@operon-core/shadcn-ui';

import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Plus,
  Shield,
  Sparkles,
  Users,
} from '@lucide/vue';

import { useTenantsStore } from '../stores/sample';

defineOptions({ name: 'TenantsStarterView' });

const router = useRouter();
const kernel = useKernel();
const tenantsStore = useTenantsStore();

function notifyShell(
  type: 'error' | 'info' | 'success' | 'warning',
  message: string,
) {
  kernel.events.notify(type, message);
}

function handleSwitchWorkspace(id: string, name: string) {
  tenantsStore.setActiveWorkspace(id);
  notifyShell('success', `Active Workspace changed to "${name}"`);
}

function navigateToDetail(id: string) {
  router.push(`/tenants/${id}`);
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Header Hero Banner -->
    <div
      class="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center"
    >
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <Building2 class="size-6 text-primary" />
          <h1 class="text-xl font-bold tracking-tight text-foreground">
            Multi-Tenant Workspace Hub
          </h1>
          <Badge variant="outline" class="border-primary/40 text-primary">
            Micro-App: @operon/tenants
          </Badge>
        </div>
        <p class="text-sm text-muted-foreground">
          Autonomous workspace orchestration, quota enforcement, and team
          isolation decoupled from Shell.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <Button
          size="sm"
          class="gap-1.5"
          @click="
            notifyShell('info', 'Workspace creation dialog (Boilerplate stub)')
          "
        >
          <Plus class="size-4" />
          Create Workspace
        </Button>
      </div>
    </div>

    <!-- Active Tenant Context (from Kernel) -->
    <Card class="border-border bg-card/60 p-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Shield class="size-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-semibold text-foreground"
                >Active Session Tenant</span
              >
              <Badge variant="secondary" class="text-xs">
                {{ kernel.auth.tenantId || 'Standalone Mock' }}
              </Badge>
            </div>
            <p class="text-xs text-muted-foreground">
              User: {{ kernel.auth.username || 'admin' }} | Roles:
              {{ kernel.auth.roles.join(', ') || 'superadmin' }}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          class="gap-1 text-xs"
          @click="
            notifyShell('info', 'Syncing workspace state with Host Shell...')
          "
        >
          <Sparkles class="size-3.5 text-amber-500" />
          Sync State
        </Button>
      </div>
    </Card>

    <!-- Workspaces Grid -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="ws in tenantsStore.workspaces"
        :key="ws.id"
        class="relative flex flex-col justify-between border-border bg-card p-5 transition-all hover:border-primary/50"
        :class="{
          'border-primary ring-1 ring-primary/20':
            ws.id === tenantsStore.activeWorkspaceId,
        }"
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="font-bold text-foreground">{{ ws.name }}</span>
            <Badge
              :variant="ws.tier === 'enterprise' ? 'default' : 'secondary'"
              class="capitalize text-xs"
            >
              {{ ws.tier }}
            </Badge>
          </div>
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <Users class="size-3.5" />
            <span>{{ ws.memberCount }} members</span>
            <span>•</span>
            <span class="font-mono text-muted-foreground/80"
              >slug: {{ ws.slug }}</span
            >
          </div>
        </div>

        <div
          class="mt-5 flex items-center justify-between border-t border-border/50 pt-4"
        >
          <Button
            v-if="ws.id !== tenantsStore.activeWorkspaceId"
            variant="outline"
            size="sm"
            class="text-xs"
            @click="handleSwitchWorkspace(ws.id, ws.name)"
          >
            Switch to This
          </Button>
          <div
            v-else
            class="flex items-center gap-1.5 text-xs font-medium text-emerald-500"
          >
            <CheckCircle2 class="size-4" />
            <span>Active</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            class="gap-1 text-xs text-muted-foreground hover:text-foreground"
            @click="navigateToDetail(ws.id)"
          >
            Details
            <ExternalLink class="size-3" />
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>
