<script lang="ts" setup>
import type { SecretRow, SecretStoreStatus } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Button, Input } from '@tuquet-core/shadcn-ui';

import {
  DownloadCloud,
  KeyRound,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  UploadCloud,
} from '@lucide/vue';

import {
  deleteSecret,
  getSecretStatus,
  pullSecrets,
  pushSecrets,
  rotateSecrets,
  setSecret,
} from '#/api';
import { $t } from '#/locales';

defineOptions({ name: 'SystemSecrets' });

const status = ref<null | SecretStoreStatus>(null);
const loading = ref(false);
const busy = ref(false);
const message = ref('');
const errorMsg = ref('');

const showAdd = ref(false);
const newName = ref('');
const newValue = ref('');

const cloudNames = computed(
  () => new Set((status.value?.cloud ?? []).map((s) => s.name)),
);
const pendingDelete = ref<null | string>(null);

async function load() {
  loading.value = true;
  errorMsg.value = '';
  try {
    status.value = await getSecretStatus();
  } catch (error: any) {
    errorMsg.value = error?.message ?? $t('page.system.secrets_daemon_offline');
    status.value = null;
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
  await run(() => setSecret(newName.value.trim(), newValue.value));
  showAdd.value = false;
  newName.value = '';
  newValue.value = '';
}

function onDelete(row: SecretRow) {
  // Two-step inline confirmation (browser confirm() is forbidden by lint rules).
  if (pendingDelete.value === row.name) {
    pendingDelete.value = null;
    run(() => deleteSecret(row.name));
    return;
  }
  pendingDelete.value = row.name;
}

onMounted(load);
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-start justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-xl font-semibold">
          <KeyRound class="size-5" />
          {{ $t('page.system.secrets') }}
        </h2>
        <p class="text-muted-foreground mt-1 text-sm">
          {{ $t('page.system.secrets_desc') }}
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" :disabled="busy" @click="load">
          <RefreshCw class="mr-1 size-4" />{{ $t('common.refresh') }}
        </Button>
        <Button variant="outline" :disabled="busy" @click="run(pullSecrets)">
          <DownloadCloud class="mr-1 size-4" />{{
            $t('page.system.secrets_pull')
          }}
        </Button>
        <Button variant="outline" :disabled="busy" @click="run(pushSecrets)">
          <UploadCloud class="mr-1 size-4" />{{
            $t('page.system.secrets_push')
          }}
        </Button>
        <Button variant="outline" :disabled="busy" @click="run(rotateSecrets)">
          <RotateCcw class="mr-1 size-4" />{{
            $t('page.system.secrets_rotate')
          }}
        </Button>
        <Button :disabled="busy" @click="showAdd = !showAdd">
          <Plus class="mr-1 size-4" />{{ $t('page.system.secrets_add') }}
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

    <!-- Add form -->
    <div
      v-if="showAdd"
      class="mb-4 flex flex-wrap items-end gap-3 rounded-lg border p-4"
    >
      <div>
        <label class="mb-1 block text-xs font-medium">{{
          $t('page.system.secrets_name')
        }}</label>
        <Input v-model="newName" placeholder="hrms_password" class="w-64" />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium">{{
          $t('page.system.secrets_value')
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

    <!-- Status -->
    <div v-if="status" class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
      <div class="rounded-lg border p-3">
        <div class="text-muted-foreground text-xs">
          {{ $t('page.system.secrets_store_path') }}
        </div>
        <div class="mt-1 truncate font-mono text-xs" :title="status.store_path">
          {{ status.store_path }}
        </div>
      </div>
      <div class="rounded-lg border p-3">
        <div class="text-muted-foreground text-xs">
          {{ $t('page.system.secrets_device_key') }}
        </div>
        <div
          class="mt-1 truncate font-mono text-xs"
          :title="status.device_public_key ?? ''"
        >
          {{ status.device_public_key ?? '—' }}
        </div>
      </div>
      <div class="rounded-lg border p-3">
        <div class="text-muted-foreground text-xs">
          {{ $t('page.system.secrets_cloud') }}
        </div>
        <div class="mt-1 text-sm">
          <span v-if="status.enrolled" class="text-green-600"
            >● {{ $t('page.system.secrets_enrolled') }}</span
          >
          <span v-else class="text-red-500"
            >● {{ $t('page.system.secrets_not_enrolled') }}</span
          >
          <span class="text-muted-foreground ml-2"
            >{{ status.cloud.length }}
            {{ $t('page.system.secrets_remote_count') }}</span
          >
        </div>
      </div>
    </div>

    <!-- Local secrets -->
    <div v-if="status" class="rounded-lg border">
      <div class="flex items-center justify-between border-b px-4 py-2">
        <span class="text-sm font-medium">
          {{ $t('page.system.secrets_local') }} ({{ status.local_count }})
        </span>
      </div>
      <table class="w-full text-sm">
        <thead class="text-muted-foreground bg-muted/40 text-xs">
          <tr>
            <th class="px-4 py-2 text-left font-medium">
              {{ $t('page.system.secrets_name') }}
            </th>
            <th class="px-4 py-2 text-left font-medium">
              {{ $t('page.system.secrets_value') }}
            </th>
            <th class="px-4 py-2 text-left font-medium">
              {{ $t('page.system.secrets_cloud') }}
            </th>
            <th class="px-4 py-2 text-right font-medium"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in status.secrets" :key="row.name" class="border-t">
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
          <tr v-if="status.secrets.length === 0">
            <td class="text-muted-foreground px-4 py-6 text-center" colspan="4">
              {{ $t('page.system.secrets_empty') }}
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
