<script lang="ts" setup>
import type { CredentialRow, CredentialStatus } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Button } from '@tuquet-core/shadcn-ui';

import { KeyRound, Plus, RefreshCw, Trash2 } from '@lucide/vue';

import {
  deleteCredential,
  getCredentials,
  pullCredentials,
  pushCredentials,
  rotateTenantKeys,
  setCredential,
} from '#/api';
import { $t } from '#/locales';

defineOptions({ name: 'SecretsCredentials' });

const data = ref<CredentialStatus | null>(null);
const loading = ref(false);
const busy = ref(false);
const message = ref('');
const errorMsg = ref('');

const showAdd = ref(false);
const newName = ref('');
const newValue = ref('');
const pendingDelete = ref<null | string>(null);

const cloudNames = computed(
  () => new Set((data.value?.cloud ?? []).map((s) => s.name)),
);

async function load() {
  loading.value = true;
  errorMsg.value = '';
  try {
    data.value = await getCredentials();
  } catch (error: any) {
    errorMsg.value = error?.message ?? $t('page.secrets.daemon_offline');
    data.value = null;
  } finally {
    loading.value = false;
  }
}

async function run(op: () => Promise<{ message: string }>) {
  busy.value = true;
  message.value = '';
  errorMsg.value = '';
  try {
    const res = await op();
    message.value = res.message;
    await load();
  } catch (error: any) {
    errorMsg.value = error?.message ?? 'Operation failed';
  } finally {
    busy.value = false;
  }
}

async function onAdd() {
  if (!newName.value.trim()) return;
  await run(() => setCredential(newName.value.trim(), newValue.value));
  showAdd.value = false;
  newName.value = '';
  newValue.value = '';
}

function onDelete(row: CredentialRow) {
  // Two-step inline confirmation (browser confirm() is forbidden by lint rules).
  if (pendingDelete.value === row.name) {
    pendingDelete.value = null;
    run(() => deleteCredential(row.name));
    return;
  }
  pendingDelete.value = row.name;
}

onMounted(load);
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="flex items-center gap-2 text-xl font-semibold">
          <KeyRound class="size-5" />
          {{ $t('page.secrets.title') }}
        </h2>
        <p class="text-muted-foreground mt-1 text-sm">
          {{ $t('page.secrets.credentials_desc') }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" :disabled="busy" @click="load">
          <RefreshCw class="mr-1 size-4" />{{ $t('common.refresh') }}
        </Button>
        <Button
          variant="outline"
          :disabled="busy"
          @click="run(pullCredentials)"
        >
          {{ $t('page.secrets.pull') }}
        </Button>
        <Button
          variant="outline"
          :disabled="busy"
          @click="run(pushCredentials)"
        >
          {{ $t('page.secrets.push') }}
        </Button>
        <Button
          variant="outline"
          :disabled="busy"
          @click="run(rotateTenantKeys)"
        >
          {{ $t('page.secrets.rotate') }}
        </Button>
        <Button :disabled="busy" @click="showAdd = !showAdd">
          <Plus class="mr-1 size-4" />{{ $t('page.secrets.add') }}
        </Button>
      </div>
    </div>

    <div
      v-if="errorMsg"
      class="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      {{ errorMsg }}
    </div>
    <div
      v-if="message"
      class="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
    >
      {{ message }}
    </div>

    <!-- Add credential -->
    <div
      v-if="showAdd"
      class="mb-4 flex flex-wrap items-end gap-3 rounded-lg border p-4"
    >
      <div>
        <label class="mb-1 block text-xs font-medium">{{
          $t('page.secrets.name')
        }}</label>
        <input
          v-model="newName"
          placeholder="hrms_password"
          class="border-input bg-background flex h-9 w-64 rounded-md border px-3 py-1 text-sm"
        />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium">{{
          $t('page.secrets.value')
        }}</label>
        <Input
          v-model="newValue"
          type="password"
          placeholder="••••••••"
          class="w-64"
        />
      </div>
      <Button :disabled="busy || !newName.trim()" @click="onAdd">
        {{ $t('common.save') }}
      </Button>
      <Button variant="ghost" @click="showAdd = false">
        {{ $t('common.cancel') }}
      </Button>
    </div>

    <!-- Store status -->
    <div v-if="data" class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
      <div class="rounded-lg border p-3">
        <div class="text-muted-foreground text-xs">
          {{ $t('page.secrets.store_path') }}
        </div>
        <div class="mt-1 truncate font-mono text-xs" :title="data.store_path">
          {{ data.store_path }}
        </div>
      </div>
      <div class="rounded-lg border p-3">
        <div class="text-muted-foreground text-xs">
          {{ $t('page.secrets.device_key') }}
        </div>
        <div
          class="mt-1 truncate font-mono text-xs"
          :title="data.device_public_key ?? ''"
        >
          {{ data.device_public_key ?? '—' }}
        </div>
      </div>
      <div class="rounded-lg border p-3">
        <div class="text-muted-foreground text-xs">
          {{ $t('page.secrets.cloud') }}
        </div>
        <div class="mt-1 text-sm">
          <span v-if="data.enrolled" class="text-green-600">
            ● {{ $t('page.secrets.enrolled') }}
          </span>
          <span v-else class="text-red-500"
            >● {{ $t('page.secrets.not_enrolled') }}</span
          >
          <span class="text-muted-foreground ml-2">
            {{ data.cloud_count }} {{ $t('page.secrets.remote_count') }}
          </span>
        </div>
      </div>
    </div>

    <!-- credentials table -->
    <div v-if="data" class="rounded-lg border">
      <div class="flex items-center justify-between border-b px-4 py-2">
        <span class="text-sm font-medium">
          {{ $t('page.secrets.local') }} ({{ data.local.length }})
        </span>
      </div>
      <table class="w-full text-sm">
        <thead class="text-muted-foreground bg-muted/40 text-xs">
          <tr>
            <th class="px-4 py-2 text-left font-medium">
              {{ $t('page.secrets.name') }}
            </th>
            <th class="px-4 py-2 text-left font-medium">
              {{ $t('page.secrets.value') }}
            </th>
            <th class="px-4 py-2 text-left font-medium">
              {{ $t('page.secrets.cloud') }}
            </th>
            <th class="px-4 py-2 text-right font-medium"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data.local" :key="row.name" class="border-t">
            <td class="px-4 py-2 font-mono">{{ row.name }}</td>
            <td class="px-4 py-2">********</td>
            <td class="px-4 py-2">
              <span v-if="cloudNames.has(row.name)" class="text-green-600"
                >✓</span
              >
              <span v-else class="text-muted-foreground">—</span>
            </td>
            <td class="px-4 py-2 text-right">
              <Button
                size="sm"
                :disabled="busy"
                :variant="pendingDelete === row.name ? 'destructive' : 'ghost'"
                @click="onDelete(row)"
              >
                <span v-if="pendingDelete === row.name" class="text-xs">
                  {{ $t('common.confirm') }}
                </span>
                <Trash2 v-else class="size-4 text-red-500" />
              </Button>
            </td>
          </tr>
          <tr v-if="data.local.length === 0">
            <td class="text-muted-foreground px-4 py-6 text-center" colspan="4">
              {{ $t('page.secrets.empty') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-else-if="loading"
      class="text-muted-foreground p-6 text-center text-sm"
    >
      {{ $t('common.loading') }}
    </div>
  </div>
</template>
