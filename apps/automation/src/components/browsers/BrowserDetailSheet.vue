<script lang="ts" setup>
import type { BrowserProfileRecord } from '../../api/browsers';

import { computed, ref, watch } from 'vue';

import { useKernel } from '@operon/kernel';

import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@operon-core/shadcn-ui';

import {
  ArrowRightLeft,
  CheckCircle2,
  Copy,
  CopyPlus,
  Loader2,
  Pencil,
  Play,
  Square,
  Star,
  X,
} from '@lucide/vue';

import { $t } from '../../locales';
import { useBrowsersStore } from '../../stores/browsers';

defineOptions({ name: 'BrowserDetailSheet' });

const props = defineProps<{
  profile: BrowserProfileRecord | null;
}>();

const emit = defineEmits<{
  edit: [profile: BrowserProfileRecord];
}>();

const open = defineModel<boolean>('open', { default: false });

const kernel = useKernel();
const store = useBrowsersStore();

const extInput = ref('');
const moveTenantId = ref('');
const savingExts = ref(false);
const moving = ref(false);

const tenantOptions = computed(() => kernel.tenant.items);

watch(
  () => props.profile,
  (p) => {
    if (!p) return;
    extInput.value = p.extensions.join(', ');
    moveTenantId.value = p.tenantId;
  },
  { immediate: true },
);

function formatBytes(bytes?: null | number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    kernel.events.notify('success', $t('common.copied'));
  } catch {
    kernel.events.notify(
      'error',
      $t('automation.overview.browser_action_failed'),
    );
  }
}

const parsedExtensions = computed(() =>
  extInput.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

const isExtensionsDirty = computed(() => {
  if (!props.profile) return false;
  return (
    JSON.stringify(parsedExtensions.value) !==
    JSON.stringify(props.profile.extensions)
  );
});

async function handleSaveExtensions() {
  if (!props.profile || !isExtensionsDirty.value) return;
  savingExts.value = true;
  try {
    await store.updateExtensions(props.profile.id, parsedExtensions.value);
    kernel.events.notify(
      'success',
      $t('automation.browsers.updated_success', { name: props.profile.name }),
    );
  } catch (error: any) {
    kernel.events.notify(
      'error',
      error?.message || $t('automation.overview.browser_action_failed'),
    );
  } finally {
    savingExts.value = false;
  }
}

async function handleMoveTenant() {
  if (!props.profile || !moveTenantId.value) return;
  if (moveTenantId.value === props.profile.tenantId) return;
  moving.value = true;
  try {
    await store.moveProfileToTenant(props.profile.id, moveTenantId.value);
    kernel.events.notify('success', $t('automation.browsers.moved_success'));
  } catch (error: any) {
    kernel.events.notify(
      'error',
      error?.message || $t('automation.overview.browser_action_failed'),
    );
  } finally {
    moving.value = false;
  }
}

async function runProfileAction(
  action: () => Promise<void>,
  successMessage: string,
) {
  try {
    await action();
    kernel.events.notify('success', successMessage);
  } catch (error: any) {
    kernel.events.notify(
      'error',
      error?.message || $t('automation.overview.browser_action_failed'),
    );
  }
}

async function handleToggleRun() {
  if (!props.profile) return;
  const target = props.profile;
  await (target.isOnline
    ? runProfileAction(
        async () => {
          await store.stopProfile(target.id);
        },
        $t('automation.overview.browser_stopped_profile', {
          name: target.name,
        }),
      )
    : runProfileAction(
        async () => {
          await store.launchProfile(target.id);
        },
        $t('automation.overview.browser_started_profile', {
          name: target.name,
        }),
      ));
}

async function handleSetDefault() {
  if (!props.profile) return;
  const target = props.profile;
  await runProfileAction(
    () => store.makeDefaultProfile(target.id),
    $t('automation.browsers.default_set_success', { name: target.name }),
  );
}

async function handleClone() {
  if (!props.profile) return;
  try {
    const cloned = await store.cloneProfile(props.profile.id);
    kernel.events.notify(
      'success',
      $t('automation.browsers.cloned_success', { name: cloned.name }),
    );
  } catch (error: any) {
    kernel.events.notify(
      'error',
      error?.message || $t('automation.overview.browser_action_failed'),
    );
  }
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      :open="open"
      modal
      side="right"
      :show-close-button="false"
      class="flex h-dvh max-h-dvh w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]"
    >
      <SheetHeader
        v-if="profile"
        class="border-border flex shrink-0 flex-row items-center justify-between gap-2 border-b px-5 py-3"
      >
        <div class="flex min-w-0 items-center gap-2">
          <SheetTitle class="truncate text-sm font-semibold tracking-tight">
            {{ profile.name }}
          </SheetTitle>
          <button
            type="button"
            class="border-border text-muted-foreground hover:bg-accent hover:text-foreground inline-flex shrink-0 items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[11px] transition-colors"
            :title="$t('automation.browsers.detail_copy_id')"
            @click="copyText(profile.id)"
          >
            <span>{{ profile.id }}</span>
            <Copy class="size-2.5 opacity-70" />
          </button>
          <Badge
            v-if="profile.isOnline"
            variant="outline"
            class="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
          >
            {{ $t('automation.browsers.running_badge') }}
          </Badge>
          <Badge v-if="profile.isDefault" variant="secondary" class="shrink-0">
            {{ $t('automation.browsers.default_badge') }}
          </Badge>
        </div>
        <SheetDescription class="sr-only">
          {{ profile.id }}
        </SheetDescription>
        <SheetClose as-child>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="text-muted-foreground hover:text-foreground size-7 shrink-0"
            :aria-label="$t('common.close')"
          >
            <X class="size-4" />
          </Button>
        </SheetClose>
      </SheetHeader>
      <SheetHeader v-else class="sr-only">
        <SheetTitle>{{ $t('automation.browsers.detail_title') }}</SheetTitle>
        <SheetDescription>
          {{ $t('automation.browsers.detail_title') }}
        </SheetDescription>
      </SheetHeader>

      <div
        v-if="profile"
        class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4"
      >
        <div class="flex flex-wrap gap-2">
          <Button
            size="sm"
            :variant="profile.isOnline ? 'destructive' : 'default'"
            class="gap-1.5"
            :disabled="store.isMutating(profile.id)"
            @click="handleToggleRun"
          >
            <Loader2
              v-if="store.isMutating(profile.id)"
              class="size-3.5 animate-spin"
            />
            <Square v-else-if="profile.isOnline" class="size-3.5" />
            <Play v-else class="size-3.5" />
            <span>
              {{
                profile.isOnline
                  ? $t('automation.browsers.action_stop')
                  : $t('automation.browsers.action_run')
              }}
            </span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            class="gap-1.5"
            @click="emit('edit', profile)"
          >
            <Pencil class="size-3.5" />
            <span>{{ $t('common.edit') }}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            class="gap-1.5"
            :disabled="profile.isDefault || store.isMutating(profile.id)"
            @click="handleSetDefault"
          >
            <Star class="size-3.5" />
            <span>{{ $t('automation.browsers.action_set_default') }}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            class="gap-1.5"
            :disabled="store.isMutating(profile.id)"
            @click="handleClone"
          >
            <CopyPlus class="size-3.5" />
            <span>{{ $t('automation.browsers.action_duplicate') }}</span>
          </Button>
        </div>

        <Tabs default-value="overview" class="w-full">
          <TabsList class="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              {{ $t('automation.browsers.detail_overview') }}
            </TabsTrigger>
            <TabsTrigger value="fingerprint">
              {{ $t('automation.browsers.detail_fingerprint') }}
            </TabsTrigger>
            <TabsTrigger value="extensions">
              {{ $t('automation.browsers.detail_extensions') }}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" class="mt-3 flex flex-col gap-3">
            <div
              class="flex flex-col gap-2 rounded-lg border border-border p-3 text-xs"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground">
                  {{ $t('automation.browsers.detail_tenant') }}
                </span>
                <code class="rounded bg-muted px-1.5 py-0.5 font-mono">
                  {{ profile.tenantId }}
                </code>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground">
                  {{ $t('automation.browsers.field_group') }}
                </span>
                <span class="font-mono">
                  {{ profile.groupName || 'default' }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground">
                  {{ $t('automation.browsers.col_proxy') }}
                </span>
                <code
                  v-if="profile.proxy"
                  class="max-w-[260px] truncate rounded bg-muted px-1.5 py-0.5 font-mono"
                >
                  {{ profile.proxy }}
                </code>
                <Badge v-else variant="outline">
                  {{ $t('automation.browsers.direct_badge') }}
                </Badge>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground">
                  {{ $t('automation.browsers.detail_disk_size') }}
                </span>
                <Skeleton
                  v-if="
                    store.detailLoading && profile.diskSizeBytes === undefined
                  "
                  class="h-4 w-14"
                />
                <span v-else class="font-mono font-medium">
                  {{ formatBytes(profile.diskSizeBytes) }}
                </span>
              </div>
              <div
                v-if="profile.tags.length > 0"
                class="flex items-start justify-between gap-2"
              >
                <span class="text-muted-foreground pt-0.5">Tags</span>
                <div class="flex flex-wrap justify-end gap-1">
                  <Badge
                    v-for="tag in profile.tags"
                    :key="tag"
                    variant="outline"
                    class="font-mono"
                  >
                    #{{ tag }}
                  </Badge>
                </div>
              </div>
              <div
                v-if="profile.pid"
                class="flex items-center justify-between gap-2"
              >
                <span class="text-muted-foreground">PID / CDP Port</span>
                <span class="font-mono">
                  {{ profile.pid }} · :{{ profile.debuggingPort }}
                </span>
              </div>
              <div
                v-if="profile.wsUrl"
                class="flex flex-col gap-1 border-t border-border/50 pt-2"
              >
                <span class="text-muted-foreground">
                  {{ $t('automation.browsers.detail_cdp_ws') }}
                </span>
                <div class="flex items-center gap-1.5">
                  <code
                    class="flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-[11px]"
                  >
                    {{ profile.wsUrl }}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    class="size-7 shrink-0"
                    @click="copyText(profile.wsUrl)"
                  >
                    <Copy class="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div
              v-if="tenantOptions.length > 1"
              class="flex flex-col gap-2 rounded-lg border border-border p-3"
            >
              <Label>
                {{ $t('automation.browsers.action_move_tenant') }}
              </Label>
              <div class="flex items-center gap-2">
                <Select v-model="moveTenantId">
                  <SelectTrigger class="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="t in tenantOptions"
                      :key="t.id"
                      :value="t.id"
                    >
                      {{ t.name }} ({{ t.slug }})
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  class="h-8 gap-1.5"
                  :disabled="
                    moving ||
                    profile.isOnline ||
                    moveTenantId === profile.tenantId
                  "
                  @click="handleMoveTenant"
                >
                  <ArrowRightLeft class="size-3.5" />
                  <span>{{ $t('automation.browsers.detail_move_btn') }}</span>
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fingerprint" class="mt-3">
            <div
              class="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 text-xs"
            >
              <div>
                <div class="text-muted-foreground">OS</div>
                <div class="font-medium capitalize">
                  {{ profile.fingerprintConfig?.osPlatform || 'windows' }}
                </div>
              </div>
              <div>
                <div class="text-muted-foreground">Seed</div>
                <div class="font-mono font-medium">
                  {{ profile.fingerprintConfig?.seed || 'Auto' }}
                </div>
              </div>
              <div>
                <div class="text-muted-foreground">CPU / RAM</div>
                <div class="font-medium">
                  {{ profile.fingerprintConfig?.hardwareConcurrency || 8 }}c /
                  {{ profile.fingerprintConfig?.deviceMemoryGb || 16 }} GB
                </div>
              </div>
              <div>
                <div class="text-muted-foreground">Viewport</div>
                <div class="font-mono">
                  {{ profile.fingerprintConfig?.screenWidth || 1920 }}x{{
                    profile.fingerprintConfig?.screenHeight || 1080
                  }}
                </div>
              </div>
              <div>
                <div class="text-muted-foreground">WebRTC</div>
                <div class="font-medium">
                  {{
                    profile.fingerprintConfig?.webrtcMode || 'proxy_shielded'
                  }}
                </div>
              </div>
              <div>
                <div class="text-muted-foreground">Timezone / Lang</div>
                <div class="truncate font-mono">
                  {{ profile.timezone || 'Auto' }} ·
                  {{ profile.fingerprintConfig?.lang || 'en-US' }}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="extensions" class="mt-3 flex flex-col gap-3">
            <div class="flex flex-col gap-1.5">
              <Label>
                {{ $t('automation.browsers.detail_extensions_hint') }}
              </Label>
              <Input
                v-model="extInput"
                placeholder="automation, /path/to/unpacked"
                class="font-mono"
              />
            </div>
            <div class="flex flex-wrap gap-1.5">
              <Badge
                v-for="ext in profile.extensions"
                :key="ext"
                variant="outline"
                class="gap-1"
              >
                <CheckCircle2 class="size-3 text-emerald-500" />
                <span>{{ ext }}</span>
              </Badge>
            </div>
            <div>
              <Button
                size="sm"
                :disabled="savingExts || !isExtensionsDirty"
                @click="handleSaveExtensions"
              >
                {{ $t('automation.browsers.detail_save_extensions') }}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SheetContent>
  </Sheet>
</template>
