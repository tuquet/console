<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DEFAULT_HOME_PATH } from '@operon/constants';
import {
  getLocalBridgeInstallInfo,
  useLocalBridgeHeartbeat,
} from '@operon/kernel';
import { openWindow } from '@operon/utils';

import {
  Badge,
  Button,
  Checkbox,
  Label,
  Progress,
  toast,
} from '@operon-core/shadcn-ui';

import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Copy,
  Download,
  Layers,
  Loader2,
  RefreshCw,
  Settings,
  Sparkles,
  Terminal,
  WifiOff,
} from '@lucide/vue';

import { $t } from '#/locales';
import {
  setShowWelcomeOnStartup,
  shouldShowWelcomeOnStartup,
} from '#/utils/welcome';

defineOptions({ name: 'Welcome' });

const router = useRouter();
const bridge = useLocalBridgeHeartbeat({ intervalMs: 5000 });
const installInfo = getLocalBridgeInstallInfo();

const showOnStartup = ref(shouldShowWelcomeOnStartup());
const copiedCommand = ref(false);
const activeStep = ref<number>(1);

const isHealthy = computed(() => bridge.status.value === 'healthy');
const isChecking = computed(() => bridge.status.value === 'checking');

const walkthroughProgress = computed(() => {
  if (isHealthy.value) return 100;
  return activeStep.value >= 2 ? 66 : 33;
});

const startActions = computed(() => [
  {
    action: () => void router.push(DEFAULT_HOME_PATH),
    description: $t('page.welcome.startOverviewDesc'),
    icon: Compass,
    title: $t('page.welcome.startOverview'),
  },
  {
    action: () => void router.push('/playground/overview'),
    description: $t('page.welcome.startPlaygroundDesc'),
    icon: Layers,
    title: $t('page.welcome.startPlayground'),
  },
  {
    action: () => window.dispatchEvent(new CustomEvent('open-preferences')),
    description: $t('page.welcome.startSettingsDesc'),
    icon: Settings,
    title: $t('page.welcome.startSettings'),
  },
  {
    action: () => openWindow('https://docs.operon.com', { target: '_blank' }),
    description: $t('page.welcome.startDocsDesc'),
    icon: BookOpen,
    title: $t('page.welcome.startDocs'),
  },
]);

const fiveW1H = computed(() => [
  { key: $t('page.welcome.whatLabel'), value: $t('page.welcome.whatText') },
  { key: $t('page.welcome.whyLabel'), value: $t('page.welcome.whyText') },
  { key: $t('page.welcome.whoLabel'), value: $t('page.welcome.whoText') },
  {
    key: $t('page.welcome.whereLabel'),
    value: $t('page.welcome.whereText'),
  },
  { key: $t('page.welcome.whenLabel'), value: $t('page.welcome.whenText') },
  {
    key: $t('page.welcome.howLabel'),
    value: $t('page.welcome.howText'),
  },
]);

function handleStartupToggle(checked: 'indeterminate' | boolean) {
  const enabled = checked === true;
  showOnStartup.value = enabled;
  setShowWelcomeOnStartup(enabled);
}

async function copyInstallCommand() {
  try {
    await navigator.clipboard.writeText(installInfo.command);
    copiedCommand.value = true;
    activeStep.value = 2;
    toast.success($t('page.overview.installCopied'));
    setTimeout(() => {
      copiedCommand.value = false;
    }, 2000);
  } catch {
    toast.error($t('page.overview.installCopyFailed'));
  }
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-8">
    <!-- VS Code-style Header -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-3">
        <div
          class="flex size-10 items-center justify-center rounded-xl border border-border/60 bg-primary/10 text-primary"
        >
          <Sparkles class="size-5" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-foreground">
            Operon Console
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ $t('page.welcome.subtitle') }}
          </p>
        </div>
      </div>
    </div>

    <!-- VS Code 2-Column Welcome Grid -->
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <!-- Left Column: Start + 5W1H Snapshot -->
      <div class="flex flex-col gap-6 lg:col-span-5">
        <section class="flex flex-col gap-2.5">
          <h2
            class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {{ $t('page.welcome.startTitle') }}
          </h2>
          <div class="flex flex-col gap-1">
            <Button
              v-for="item in startActions"
              :key="item.title"
              type="button"
              variant="ghost"
              class="group h-auto w-full items-start justify-start gap-3 rounded-lg px-2.5 py-2 text-left font-normal whitespace-normal hover:bg-accent/60"
              @click="item.action"
            >
              <component
                :is="item.icon"
                class="mt-0.5 size-4 shrink-0 text-primary"
              />
              <div class="min-w-0">
                <p
                  class="text-sm font-medium text-foreground group-hover:text-primary"
                >
                  {{ item.title }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ item.description }}
                </p>
              </div>
            </Button>
          </div>
        </section>

        <section class="flex flex-col gap-2.5">
          <h2
            class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {{ $t('page.welcome.fiveWTitle') }}
          </h2>
          <div
            class="flex flex-col divide-y divide-border/50 rounded-xl border border-border/60 bg-card/50"
          >
            <div
              v-for="row in fiveW1H"
              :key="row.key"
              class="flex flex-col gap-0.5 px-3.5 py-2.5"
            >
              <span class="text-xs font-semibold text-foreground">
                {{ row.key }}
              </span>
              <span class="text-xs leading-relaxed text-muted-foreground">
                {{ row.value }}
              </span>
            </div>
          </div>
        </section>
      </div>

      <!-- Right Column: Interactive Walkthrough -->
      <div class="flex flex-col gap-4 lg:col-span-7">
        <div class="flex items-center justify-between">
          <h2
            class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {{ $t('page.welcome.walkthroughTitle') }}
          </h2>
          <Badge
            :variant="isHealthy ? 'secondary' : 'outline'"
            :class="
              isHealthy
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'text-muted-foreground'
            "
            class="gap-1.5 text-[11px]"
          >
            <Activity v-if="isHealthy" class="size-3" />
            <Loader2 v-else-if="isChecking" class="size-3 animate-spin" />
            <WifiOff v-else class="size-3 text-amber-500" />
            <span>
              {{
                isChecking
                  ? $t('page.overview.daemonChecking')
                  : isHealthy
                    ? $t('page.overview.daemonHealthy')
                    : $t('page.overview.daemonOffline')
              }}
            </span>
          </Badge>
        </div>

        <Progress :model-value="walkthroughProgress" class="h-1.5" />

        <!-- Step 1 -->
        <div
          class="cursor-pointer rounded-xl border p-4 transition-colors"
          :class="
            activeStep === 1
              ? 'border-primary/40 bg-card'
              : 'border-border/60 bg-card/40 hover:border-border'
          "
          @click="activeStep = 1"
        >
          <div class="flex items-start gap-3">
            <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-emerald-500" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-foreground">
                {{ $t('page.welcome.step1Title') }}
              </p>
              <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
                {{ $t('page.welcome.step1Desc') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Step 2: Daemon Setup -->
        <div
          class="cursor-pointer rounded-xl border p-4 transition-colors"
          :class="
            activeStep === 2 || !isHealthy
              ? 'border-primary/40 bg-card'
              : 'border-border/60 bg-card/40 hover:border-border'
          "
          @click="activeStep = 2"
        >
          <div class="flex items-start gap-3">
            <CheckCircle2
              v-if="isHealthy"
              class="mt-0.5 size-4 shrink-0 text-emerald-500"
            />
            <Terminal v-else class="mt-0.5 size-4 shrink-0 text-primary" />
            <div class="min-w-0 flex-1 space-y-3">
              <div>
                <p class="text-sm font-medium text-foreground">
                  {{ $t('page.welcome.step2Title') }}
                </p>
                <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {{ $t('page.welcome.step2Desc') }}
                </p>
              </div>

              <div
                v-if="!isHealthy"
                class="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2"
              >
                <code class="truncate font-mono text-[11px] text-foreground">
                  {{ installInfo.command }}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  class="h-7 shrink-0 px-2 text-xs"
                  @click.stop="copyInstallCommand"
                >
                  <Copy class="mr-1 size-3" />
                  {{
                    copiedCommand
                      ? $t('page.overview.installCopied')
                      : $t('page.overview.installCopy')
                  }}
                </Button>
              </div>

              <div v-if="!isHealthy" class="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  as="a"
                  :href="installInfo.releasesUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="h-8 gap-1.5 text-xs"
                  @click.stop
                >
                  <Download class="size-3.5" />
                  {{ $t('page.overview.installDownload') }}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  class="h-8 gap-1.5 text-xs"
                  :disabled="isChecking"
                  @click.stop="bridge.checkNow()"
                >
                  <RefreshCw
                    class="size-3.5"
                    :class="{ 'animate-spin': isChecking }"
                  />
                  {{ $t('page.overview.retryCheck') }}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Continue -->
        <div
          class="cursor-pointer rounded-xl border p-4 transition-colors"
          :class="
            isHealthy
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-border/60 bg-card/40 hover:border-border'
          "
          @click="activeStep = 3"
        >
          <div class="flex items-start gap-3">
            <CheckCircle2
              class="mt-0.5 size-4 shrink-0"
              :class="
                isHealthy ? 'text-emerald-500' : 'text-muted-foreground/40'
              "
            />
            <div class="min-w-0 flex-1 space-y-3">
              <div>
                <p class="text-sm font-medium text-foreground">
                  {{ $t('page.welcome.step3Title') }}
                </p>
                <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {{ $t('page.welcome.step3Desc') }}
                </p>
              </div>
              <Button
                size="sm"
                class="h-8 gap-1.5 text-xs"
                @click.stop="router.push(DEFAULT_HOME_PATH)"
              >
                {{ $t('page.welcome.continueBtn') }}
                <ArrowRight class="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- VS Code-style Startup Checkbox Footer -->
    <div
      class="flex items-center justify-between border-t border-border/50 pt-4"
    >
      <div class="flex items-center gap-2">
        <Checkbox
          id="welcome-startup-checkbox"
          :model-value="showOnStartup"
          @update:model-value="handleStartupToggle"
        />
        <Label
          for="welcome-startup-checkbox"
          class="cursor-pointer text-xs text-muted-foreground"
        >
          {{ $t('page.welcome.showOnStartup') }}
        </Label>
      </div>
    </div>
  </div>
</template>
