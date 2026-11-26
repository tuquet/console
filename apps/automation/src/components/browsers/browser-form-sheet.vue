<script lang="ts" setup>
import type {
  BrowserProfileRecord,
  FingerprintConfig,
  ProbeProxyResult,
} from '../../api/browsers';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

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
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

import { AlertTriangle, Dices, Loader2, RotateCcw, Wifi } from '@lucide/vue';

import { $t } from '../../locales';
import { useBrowsersStore } from '../../stores/browsers';

defineOptions({ name: 'BrowserFormSheet' });

const props = defineProps<{
  target: BrowserProfileRecord | null;
}>();

const emit = defineEmits<{
  saved: [mode: 'create' | 'restart' | 'update', name: string];
}>();

const open = defineModel<boolean>('open', { default: false });

const store = useBrowsersStore();

const isSmallScreen = ref(false);
let mediaQuery: MediaQueryList | null = null;

function updateViewport(event?: MediaQueryList | MediaQueryListEvent) {
  isSmallScreen.value = Boolean(event?.matches);
}

onMounted(() => {
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
  ) {
    mediaQuery = window.matchMedia('(max-width: 639px)');
    updateViewport(mediaQuery);
    mediaQuery.addEventListener('change', updateViewport);
  }
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', updateViewport);
  mediaQuery = null;
});

const name = ref('');
const customId = ref('');
const groupName = ref('default');
const tagsRaw = ref('');
const osPlatform = ref<'linux' | 'macos' | 'windows'>('windows');
const seed = ref(100_000);
const hardwareConcurrency = ref('8');
const deviceMemoryGb = ref('16');
const screenWidth = ref('1920');
const screenHeight = ref('1080');
const webrtcMode = ref<'default' | 'disabled' | 'proxy_shielded'>(
  'proxy_shielded',
);
const timezone = ref('Asia/Ho_Chi_Minh');
const lang = ref('en-US');
const userAgent = ref('');
const proxy = ref('');

const probing = ref(false);
const probeResult = ref<null | ProbeProxyResult>(null);
const submitting = ref(false);
const errorMessage = ref('');

const isEditMode = computed(() => Boolean(props.target));
const isTargetRunning = computed(() => Boolean(props.target?.isOnline));

function randomSeed() {
  seed.value = Math.floor(100_000 + Math.random() * 9_000_000);
}

function applyOsPreset(os: 'linux' | 'macos' | 'windows') {
  osPlatform.value = os;
  if (os === 'macos') {
    screenWidth.value = '2560';
    screenHeight.value = '1440';
  } else {
    screenWidth.value = '1920';
    screenHeight.value = '1080';
  }
}

function resetFromTarget(target: BrowserProfileRecord | null) {
  probeResult.value = null;
  errorMessage.value = '';
  if (target) {
    const fp = target.fingerprintConfig || {};
    name.value = target.name;
    customId.value = target.id;
    groupName.value = target.groupName || 'default';
    tagsRaw.value = target.tags.join(', ');
    osPlatform.value =
      (fp.osPlatform as 'linux' | 'macos' | 'windows') || 'windows';
    seed.value = fp.seed || 133_742;
    hardwareConcurrency.value = String(fp.hardwareConcurrency || 8);
    deviceMemoryGb.value = String(fp.deviceMemoryGb || 16);
    screenWidth.value = String(fp.screenWidth || 1920);
    screenHeight.value = String(fp.screenHeight || 1080);
    webrtcMode.value =
      (fp.webrtcMode as 'default' | 'disabled' | 'proxy_shielded') ||
      'proxy_shielded';
    timezone.value = target.timezone || 'Asia/Ho_Chi_Minh';
    lang.value = fp.lang || 'en-US';
    userAgent.value = target.userAgent || '';
    proxy.value = target.proxy || '';
    return;
  }

  name.value = '';
  customId.value = '';
  groupName.value = 'default';
  tagsRaw.value = '';
  osPlatform.value = 'windows';
  randomSeed();
  hardwareConcurrency.value = '8';
  deviceMemoryGb.value = '16';
  screenWidth.value = '1920';
  screenHeight.value = '1080';
  webrtcMode.value = 'proxy_shielded';
  timezone.value = 'Asia/Ho_Chi_Minh';
  lang.value = 'en-US';
  userAgent.value = '';
  proxy.value = '';
}

watch(
  [open, () => props.target],
  ([isOpen]) => {
    if (isOpen) {
      resetFromTarget(props.target);
    }
  },
  { immediate: true },
);

async function handleProbeProxy() {
  const clean = proxy.value.trim();
  if (!clean) return;
  probing.value = true;
  probeResult.value = null;
  errorMessage.value = '';
  try {
    probeResult.value = await store.probeProxy(clean);
  } catch (error: any) {
    errorMessage.value =
      error?.message || $t('automation.overview.browser_action_failed');
  } finally {
    probing.value = false;
  }
}

function parseTags(): string[] {
  return tagsRaw.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildFingerprintPayload(): FingerprintConfig {
  return {
    deviceMemoryGb: Number(deviceMemoryGb.value) || 16,
    devicePixelRatio: osPlatform.value === 'macos' ? 2 : 1,
    hardwareConcurrency: Number(hardwareConcurrency.value) || 8,
    lang: lang.value.trim() || 'en-US',
    noiseLevel: 'balanced',
    osPlatform: osPlatform.value,
    screenHeight: Number(screenHeight.value) || 1080,
    screenWidth: Number(screenWidth.value) || 1920,
    seed: Number(seed.value) || undefined,
    webrtcMode: webrtcMode.value,
  };
}

async function submitForm(restartAfterSave = false) {
  const trimmedName = name.value.trim();
  if (!trimmedName) {
    errorMessage.value = $t('automation.overview.browser_action_failed');
    return;
  }

  submitting.value = true;
  errorMessage.value = '';
  try {
    const fp = buildFingerprintPayload();
    const tags = parseTags();
    const cleanProxy = proxy.value.trim();
    const cleanUa = userAgent.value.trim();
    const cleanTz = timezone.value.trim();
    const cleanGroup = groupName.value.trim() || 'default';

    if (props.target) {
      await store.patchProfile(props.target.id, {
        fingerprintConfig: fp,
        groupName: cleanGroup,
        name: trimmedName,
        proxy: cleanProxy || null,
        tags,
        timezone: cleanTz || null,
        userAgent: cleanUa || null,
      });
      if (restartAfterSave && props.target.isOnline) {
        await store.stopProfile(props.target.id, false);
        await store.launchProfile(props.target.id);
        emit('saved', 'restart', trimmedName);
      } else {
        emit('saved', 'update', trimmedName);
      }
    } else {
      await store.createProfile({
        fingerprintConfig: fp,
        groupName: cleanGroup,
        id: customId.value.trim() || undefined,
        name: trimmedName,
        proxy: cleanProxy || undefined,
        tags,
        timezone: cleanTz || undefined,
        userAgent: cleanUa || undefined,
      });
      emit('saved', 'create', trimmedName);
    }

    open.value = false;
  } catch (error: any) {
    errorMessage.value =
      error?.message || $t('automation.overview.browser_action_failed');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      :open="open"
      modal
      :side="isSmallScreen ? 'bottom' : 'right'"
      :class="
        cn(
          'flex w-full flex-col gap-0 overflow-hidden p-0',
          isSmallScreen
            ? 'max-h-[90dvh] rounded-t-xl'
            : 'h-dvh max-h-dvh sm:max-w-[540px]',
        )
      "
    >
      <div
        v-if="isSmallScreen"
        aria-hidden="true"
        class="bg-muted-foreground/30 mx-auto mt-2.5 mb-0.5 h-1 w-9 shrink-0 rounded-full"
      ></div>

      <SheetHeader class="border-border shrink-0 border-b px-5 py-3.5 pr-11">
        <SheetTitle class="truncate text-sm tracking-tight">
          {{
            isEditMode
              ? $t('automation.browsers.form_edit_title')
              : $t('automation.browsers.form_create_title')
          }}
        </SheetTitle>
        <SheetDescription class="sr-only">
          {{
            isEditMode
              ? $t('automation.browsers.form_edit_title')
              : $t('automation.browsers.form_create_title')
          }}
        </SheetDescription>
      </SheetHeader>

      <form
        class="flex min-h-0 flex-1 flex-col"
        @submit.prevent="submitForm(false)"
      >
        <div class="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div
            v-if="isEditMode && isTargetRunning"
            class="text-ui-label flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-500"
          >
            <AlertTriangle class="mt-0.5 size-4 shrink-0" />
            <span>{{ $t('automation.browsers.form_running_warning') }}</span>
          </div>

          <div class="border-border/70 space-y-3 rounded-lg border p-3.5">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <Label class="text-ui-label">
                  {{ $t('automation.browsers.field_name') }}
                </Label>
                <Input
                  v-model="name"
                  class="text-ui-input h-9"
                  placeholder="e.g. Shopee Checkout #1"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <Label class="text-ui-label">
                  {{ $t('automation.browsers.field_id') }}
                </Label>
                <Input
                  v-model="customId"
                  class="text-ui-input h-9 font-mono"
                  :disabled="isEditMode"
                  placeholder="auto-generated"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <Label class="text-ui-label">
                  {{ $t('automation.browsers.field_group') }}
                </Label>
                <Input
                  v-model="groupName"
                  class="text-ui-input h-9"
                  placeholder="default"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <Label class="text-ui-label">
                  {{ $t('automation.browsers.field_tags') }}
                </Label>
                <Input
                  v-model="tagsRaw"
                  class="text-ui-input h-9"
                  placeholder="vip, sea, checkout"
                />
              </div>
            </div>
          </div>

          <div class="border-border/70 space-y-3 rounded-lg border p-3.5">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div class="flex flex-col gap-1.5">
                <Label class="text-ui-label">
                  {{ $t('automation.browsers.field_os') }}
                </Label>
                <Select
                  :model-value="osPlatform"
                  @update:model-value="
                    (v) => applyOsPreset(v as 'linux' | 'macos' | 'windows')
                  "
                >
                  <SelectTrigger class="text-ui-input h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="windows">Windows</SelectItem>
                    <SelectItem value="macos">macOS</SelectItem>
                    <SelectItem value="linux">Linux</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="flex flex-col gap-1.5">
                <Label class="text-ui-label">
                  {{ $t('automation.browsers.field_cores') }}
                </Label>
                <Select v-model="hardwareConcurrency">
                  <SelectTrigger class="text-ui-input h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="16">16</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="flex flex-col gap-1.5">
                <Label class="text-ui-label">
                  {{ $t('automation.browsers.field_ram') }}
                </Label>
                <Select v-model="deviceMemoryGb">
                  <SelectTrigger class="text-ui-input h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 GB</SelectItem>
                    <SelectItem value="8">8 GB</SelectItem>
                    <SelectItem value="16">16 GB</SelectItem>
                    <SelectItem value="32">32 GB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div class="flex flex-col gap-1.5 sm:col-span-2">
                <Label class="text-ui-label">
                  {{ $t('automation.browsers.field_seed') }}
                </Label>
                <div class="flex items-center gap-2">
                  <Input
                    v-model.number="seed"
                    class="text-ui-input h-9 font-mono"
                    type="number"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    class="h-9 shrink-0 gap-1.5"
                    @click="randomSeed"
                  >
                    <Dices class="size-3.5" />
                    <span>{{ $t('automation.browsers.randomize_seed') }}</span>
                  </Button>
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <Label class="text-ui-label">
                  {{ $t('automation.browsers.field_webrtc') }}
                </Label>
                <Select v-model="webrtcMode">
                  <SelectTrigger class="text-ui-input h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proxy_shielded">
                      Proxy Shielded
                    </SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="default">Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="flex flex-col gap-1.5">
                <Label class="text-ui-label">
                  {{ $t('automation.browsers.field_resolution') }}
                </Label>
                <div class="flex items-center gap-1.5">
                  <Input v-model="screenWidth" class="text-ui-input h-9" />
                  <span class="text-muted-foreground text-ui-label">x</span>
                  <Input v-model="screenHeight" class="text-ui-input h-9" />
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <Label class="text-ui-label">
                  {{ $t('automation.browsers.field_timezone') }}
                </Label>
                <Input
                  v-model="timezone"
                  class="text-ui-input h-9"
                  placeholder="Asia/Ho_Chi_Minh"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <Label class="text-ui-label">
                  {{ $t('automation.browsers.field_lang') }}
                </Label>
                <Input
                  v-model="lang"
                  class="text-ui-input h-9"
                  placeholder="en-US"
                />
              </div>
            </div>
          </div>

          <div class="border-border/70 space-y-3 rounded-lg border p-3.5">
            <div class="flex flex-col gap-1.5">
              <Label class="text-ui-label">
                {{ $t('automation.browsers.field_proxy') }}
              </Label>
              <div class="flex items-center gap-2">
                <Input
                  v-model="proxy"
                  class="text-ui-input h-9 font-mono"
                  placeholder="socks5://127.0.0.1:1080 or http://user:pass@host:8080"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="h-9 shrink-0 gap-1.5"
                  :disabled="probing || !proxy.trim()"
                  @click="handleProbeProxy"
                >
                  <Loader2 v-if="probing" class="size-3.5 animate-spin" />
                  <Wifi v-else class="size-3.5" />
                  <span>{{ $t('automation.browsers.test_proxy_btn') }}</span>
                </Button>
              </div>
              <div v-if="probeResult" class="pt-1">
                <Badge
                  variant="outline"
                  :class="
                    probeResult.alive
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                      : 'border-destructive/30 bg-destructive/10 text-destructive'
                  "
                >
                  {{
                    probeResult.alive
                      ? $t('automation.browsers.proxy_alive_msg', {
                          ip: probeResult.egressIp || probeResult.protocol,
                          rtt: probeResult.rttMs,
                        })
                      : $t('automation.browsers.proxy_dead_msg', {
                          error: probeResult.error || 'failed',
                        })
                  }}
                </Badge>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <Label class="text-ui-label">
                {{ $t('automation.browsers.field_ua') }}
              </Label>
              <Input
                v-model="userAgent"
                class="text-ui-input h-9"
                placeholder="Leave blank for automatic Chromium fingerprint UA"
              />
            </div>
          </div>

          <p v-if="errorMessage" class="text-ui-label text-destructive">
            {{ errorMessage }}
          </p>
        </div>

        <SheetFooter
          class="border-border bg-muted/25 flex shrink-0 flex-row items-center justify-end gap-2 border-t px-4 py-3 sm:px-5"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            class="h-8"
            :disabled="submitting"
            @click="open = false"
          >
            {{ $t('common.cancel') }}
          </Button>
          <Button
            v-if="isEditMode && isTargetRunning"
            type="button"
            variant="secondary"
            size="sm"
            class="h-8 gap-1.5"
            :disabled="submitting"
            @click="submitForm(true)"
          >
            <RotateCcw class="size-3.5" />
            <span>{{ $t('automation.browsers.save_restart_btn') }}</span>
          </Button>
          <Button
            type="submit"
            size="sm"
            class="h-8"
            :disabled="submitting || !name.trim()"
          >
            <Loader2 v-if="submitting" class="mr-1.5 size-3.5 animate-spin" />
            <span>{{ $t('common.save') }}</span>
          </Button>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
</template>
