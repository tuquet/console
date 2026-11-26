<script lang="ts" setup>
import type { BulkProxyCheckItem, ProxyProtocol } from './proxy-bulk-check';

import { computed, ref, watch } from 'vue';

import { useDaemonHeartbeat, useKernel } from '@operon/kernel';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from '@operon-core/shadcn-ui';

import {
  Check,
  Copy,
  Globe,
  Loader2,
  Play,
  Square,
  Trash2,
  WifiOff,
} from '@lucide/vue';

import { $t } from '#/locales';

import { parseProxyLines, runBulkProxyCheck } from './proxy-bulk-check';

defineOptions({ name: 'ProxyBulkCheckDialog' });

const open = defineModel<boolean>('open', { default: false });

const kernel = useKernel();
const daemon = useDaemonHeartbeat({ intervalMs: 5000 });

const rawInput = ref('');
const defaultProtocol = ref<ProxyProtocol>('http');
const timeoutSecs = ref('5');
const checking = ref(false);
const results = ref<BulkProxyCheckItem[]>([]);
const filter = ref<'alive' | 'all' | 'dead'>('all');
const abortController = ref<AbortController | null>(null);

const stats = computed(() => {
  const total = results.value.length;
  const alive = results.value.filter((r) => r.status === 'alive').length;
  const dead = results.value.filter((r) => r.status === 'dead').length;
  const done = alive + dead;
  return { alive, dead, done, total };
});

const filteredResults = computed(() => {
  if (filter.value === 'all') return results.value;
  return results.value.filter((r) => r.status === filter.value);
});

const aliveLines = computed(() =>
  results.value.filter((r) => r.status === 'alive').map((r) => r.raw),
);

watch(open, (isOpen) => {
  if (!isOpen && checking.value) {
    abortController.value?.abort();
  }
});

async function handleCheck() {
  if (!daemon.isHealthy.value) {
    toast.error($t('page.tools.proxyCheck.daemonOffline'));
    return;
  }
  const entries = parseProxyLines(rawInput.value, defaultProtocol.value);
  if (entries.length === 0) {
    toast.error($t('page.tools.proxyCheck.emptyInput'));
    return;
  }

  abortController.value?.abort();
  const controller = new AbortController();
  abortController.value = controller;
  checking.value = true;
  filter.value = 'all';

  try {
    await runBulkProxyCheck(
      entries,
      (proxyUri, timeout, signal) =>
        kernel.api.localDaemonFetch('/api/v1/browsers/proxy/probe', {
          body: JSON.stringify({ proxy: proxyUri, timeoutSecs: timeout }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
          signal,
        }),
      {
        concurrency: 8,
        onUpdate: (items) => {
          results.value = items;
        },
        signal: controller.signal,
        timeoutSecs: Number(timeoutSecs.value) || 5,
      },
    );
  } finally {
    checking.value = false;
    abortController.value = null;
  }
}

function handleStop() {
  abortController.value?.abort();
}

function handleClear() {
  if (checking.value) return;
  rawInput.value = '';
  results.value = [];
  filter.value = 'all';
}

async function copyText(text: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast.success($t('page.tools.proxyCheck.copied'));
  } catch {
    toast.error($t('page.tools.proxyCheck.copyFailed'));
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex max-h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-3xl"
    >
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Globe class="size-4 text-primary" />
          <span>{{ $t('page.tools.proxyCheck.title') }}</span>
        </DialogTitle>
        <DialogDescription>
          {{ $t('page.tools.proxyCheck.description') }}
        </DialogDescription>
      </DialogHeader>

      <div
        v-if="!daemon.isHealthy.value"
        class="flex items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400"
      >
        <span class="flex items-center gap-2">
          <WifiOff class="size-3.5 shrink-0" />
          {{ $t('page.tools.proxyCheck.daemonOffline') }}
        </span>
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap items-end justify-between gap-2">
          <Label for="bulk-proxy-input" class="text-xs font-medium">
            {{ $t('page.tools.proxyCheck.inputLabel') }}
          </Label>
          <div class="flex items-center gap-2">
            <Select v-model="defaultProtocol" :disabled="checking">
              <SelectTrigger class="h-8 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="http">HTTP</SelectItem>
                <SelectItem value="https">HTTPS</SelectItem>
                <SelectItem value="socks5">SOCKS5</SelectItem>
                <SelectItem value="socks5h">SOCKS5H</SelectItem>
              </SelectContent>
            </Select>
            <Select v-model="timeoutSecs" :disabled="checking">
              <SelectTrigger class="h-8 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3s</SelectItem>
                <SelectItem value="5">5s</SelectItem>
                <SelectItem value="10">10s</SelectItem>
                <SelectItem value="15">15s</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Textarea
          id="bulk-proxy-input"
          v-model="rawInput"
          :disabled="checking"
          :placeholder="$t('page.tools.proxyCheck.placeholder')"
          class="min-h-28 resize-y font-mono text-xs"
        />
      </div>

      <div
        v-if="results.length > 0"
        class="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 text-xs">
            <Button
              size="sm"
              class="h-7 px-2.5 text-xs"
              :variant="filter === 'all' ? 'default' : 'outline'"
              @click="filter = 'all'"
            >
              {{ $t('page.tools.proxyCheck.filterAll') }} ({{ stats.total }})
            </Button>
            <Button
              size="sm"
              class="h-7 px-2.5 text-xs"
              :variant="filter === 'alive' ? 'default' : 'outline'"
              @click="filter = 'alive'"
            >
              {{ $t('page.tools.proxyCheck.filterAlive') }} ({{ stats.alive }})
            </Button>
            <Button
              size="sm"
              class="h-7 px-2.5 text-xs"
              :variant="filter === 'dead' ? 'default' : 'outline'"
              @click="filter = 'dead'"
            >
              {{ $t('page.tools.proxyCheck.filterDead') }} ({{ stats.dead }})
            </Button>
            <span v-if="checking" class="ml-1 text-muted-foreground">
              {{ stats.done }} / {{ stats.total }}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            class="h-7 px-2.5 text-xs"
            :disabled="aliveLines.length === 0"
            @click="copyText(aliveLines.join('\n'))"
          >
            <Copy class="mr-1 size-3" />
            {{ $t('page.tools.proxyCheck.copyAlive') }} ({{
              aliveLines.length
            }})
          </Button>
        </div>

        <div
          class="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border"
        >
          <table class="w-full text-left text-xs">
            <thead
              class="sticky top-0 border-b border-border bg-muted/80 text-muted-foreground backdrop-blur"
            >
              <tr>
                <th class="w-10 px-2.5 py-2 font-medium">#</th>
                <th class="px-2.5 py-2 font-medium">
                  {{ $t('page.tools.proxyCheck.colProxy') }}
                </th>
                <th class="w-28 px-2.5 py-2 font-medium">
                  {{ $t('page.tools.proxyCheck.colStatus') }}
                </th>
                <th class="px-2.5 py-2 font-medium">
                  {{ $t('page.tools.proxyCheck.colDetails') }}
                </th>
                <th class="w-10 px-2 py-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/60">
              <tr
                v-for="item in filteredResults"
                :key="item.id"
                class="hover:bg-muted/30"
              >
                <td class="px-2.5 py-1.5 font-mono text-muted-foreground">
                  {{ item.id + 1 }}
                </td>
                <td class="max-w-52 truncate px-2.5 py-1.5 font-mono">
                  {{ item.display }}
                </td>
                <td class="px-2.5 py-1.5">
                  <Badge
                    v-if="item.status === 'alive'"
                    variant="outline"
                    class="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  >
                    <Check class="mr-1 size-3" />
                    {{ item.rttMs ?? 0 }}ms
                  </Badge>
                  <Badge
                    v-else-if="item.status === 'dead'"
                    variant="destructive"
                  >
                    {{ $t('page.tools.proxyCheck.statusDead') }}
                  </Badge>
                  <span
                    v-else-if="item.status === 'checking'"
                    class="inline-flex items-center gap-1 text-muted-foreground"
                  >
                    <Loader2 class="size-3 animate-spin" />
                    ...
                  </span>
                  <span v-else class="text-muted-foreground">—</span>
                </td>
                <td
                  class="max-w-64 truncate px-2.5 py-1.5 text-muted-foreground"
                >
                  <template v-if="item.status === 'alive'">
                    <span class="font-mono text-foreground">
                      {{ item.egressIp || '-' }}
                    </span>
                    <span v-if="item.country || item.colo" class="ml-1.5">
                      ({{
                        [item.country, item.colo].filter(Boolean).join(' · ')
                      }})
                    </span>
                  </template>
                  <span v-else-if="item.error">{{ item.error }}</span>
                </td>
                <td class="px-2 py-1.5 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    class="size-6"
                    @click="copyText(item.raw)"
                  >
                    <Copy class="size-3" />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <DialogFooter
        class="flex items-center justify-between gap-2 sm:justify-between"
      >
        <Button
          size="sm"
          variant="ghost"
          :disabled="checking || (!rawInput && results.length === 0)"
          @click="handleClear"
        >
          <Trash2 class="mr-1.5 size-3.5" />
          {{ $t('page.tools.proxyCheck.clear') }}
        </Button>

        <div class="flex items-center gap-2">
          <Button
            v-if="checking"
            size="sm"
            variant="destructive"
            @click="handleStop"
          >
            <Square class="mr-1.5 size-3.5" />
            {{ $t('page.tools.proxyCheck.stop') }}
          </Button>
          <Button
            v-else
            size="sm"
            :disabled="!daemon.isHealthy.value || !rawInput.trim()"
            @click="handleCheck"
          >
            <Play class="mr-1.5 size-3.5" />
            {{ $t('page.tools.proxyCheck.check') }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
