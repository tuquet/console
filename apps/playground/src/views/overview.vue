<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { useKernel } from '@operon/kernel';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@operon-core/shadcn-ui';

import {
  ArrowRight,
  Bell,
  Blocks,
  CheckCircle2,
  Cpu,
  Layers,
  PanelRight,
  Table2,
} from '@lucide/vue';

import { $t } from '../locales';

defineOptions({ name: 'PlaygroundOverview' });

const router = useRouter();
const kernel = useKernel();

const componentGroups = computed(() => [
  {
    actionable: true,
    badge: 'apps/playground/components/data-table',
    description: $t('playground.overview_card_datatable_desc'),
    icon: Table2,
    title: $t('playground.overview_card_datatable_title'),
  },
  {
    actionable: false,
    badge: '@operon-core/shadcn-ui',
    description: $t('playground.overview_card_primitives_desc'),
    icon: Blocks,
    title: $t('playground.overview_card_primitives_title'),
  },
  {
    actionable: false,
    badge: '@operon-core/popup-ui & form-ui',
    description: $t('playground.overview_card_overlays_desc'),
    icon: PanelRight,
    title: $t('playground.overview_card_overlays_title'),
  },
  {
    actionable: false,
    badge: '@operon/kernel',
    description: $t('playground.overview_card_kernel_desc'),
    icon: Cpu,
    title: $t('playground.overview_card_kernel_title'),
  },
]);

const guidelines = computed(() => [
  $t('playground.overview_guide_1'),
  $t('playground.overview_guide_2'),
  $t('playground.overview_guide_3'),
]);

function openTasksDemo() {
  void router.push('/playground/tasks');
}

function triggerDemoToast() {
  kernel.events.notify('success', $t('playground.overview_toast_message'));
}
</script>

<template>
  <div class="flex flex-col gap-6 p-4 sm:p-6">
    <!-- Hero / Core Message -->
    <Card class="border-border/60 py-0 shadow-xs">
      <CardContent
        class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        <div class="flex min-w-0 flex-col gap-1.5">
          <div class="flex items-center gap-2">
            <Layers class="size-5 text-primary" />
            <Badge variant="secondary" class="text-xs">
              {{ $t('playground.overview_badge') }}
            </Badge>
          </div>
          <h1 class="text-xl font-semibold tracking-tight text-foreground">
            {{ $t('playground.overview_title') }}
          </h1>
          <p class="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            {{ $t('playground.overview_description') }}
          </p>
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" @click="triggerDemoToast">
            <Bell class="mr-1.5 size-3.5" />
            {{ $t('playground.overview_cta_toast') }}
          </Button>
          <Button size="sm" @click="openTasksDemo">
            {{ $t('playground.overview_cta_tasks') }}
            <ArrowRight class="ml-1.5 size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Common Components Catalog -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card
        v-for="group in componentGroups"
        :key="group.title"
        class="border-border/60 shadow-xs transition-colors"
        :class="group.actionable ? 'cursor-pointer hover:border-border' : ''"
        @click="group.actionable && openTasksDemo()"
      >
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              >
                <component :is="group.icon" class="size-4" />
              </div>
              <CardTitle class="text-sm font-semibold">
                {{ group.title }}
              </CardTitle>
            </div>
            <Badge variant="outline" class="font-mono text-[10px]">
              {{ group.badge }}
            </Badge>
          </div>
          <CardDescription class="pt-1.5 text-xs leading-relaxed">
            {{ group.description }}
          </CardDescription>
        </CardHeader>
        <CardContent v-if="group.actionable" class="pt-0">
          <span
            class="inline-flex items-center gap-1 text-xs font-medium text-primary"
          >
            {{ $t('playground.overview_card_action_view') }}
            <ArrowRight class="size-3" />
          </span>
        </CardContent>
      </Card>
    </div>

    <!-- Adoption Guidelines -->
    <Card class="border-border/60 shadow-xs">
      <CardHeader class="pb-3">
        <CardTitle class="text-sm font-semibold">
          {{ $t('playground.overview_guide_title') }}
        </CardTitle>
      </CardHeader>
      <CardContent class="pt-0">
        <ul class="flex flex-col gap-2.5">
          <li
            v-for="(item, index) in guidelines"
            :key="index"
            class="flex items-start gap-2.5 text-xs text-muted-foreground"
          >
            <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-emerald-500" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>
</template>
