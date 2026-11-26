<script setup lang="ts">
import type {
  SchemaActionDef,
  SchemaFieldContext,
  SchemaFieldDef,
  SchemaSectionDef,
  SchemaSheetDefinition,
  SchemaSheetMode,
} from './types';

import { computed, provide, reactive, ref, useId, watch } from 'vue';

import {
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

import { Check, Copy, Loader2 } from '@lucide/vue';
import { useMediaQuery } from '@vueuse/core';

import SchemaSectionRenderer from './schema-section-renderer.vue';

const props = withDefaults(
  defineProps<{
    closeLabel?: string;
    mode?: SchemaSheetMode;
    open: boolean;
    record?: any;
    schema: SchemaSheetDefinition<any, any>;
  }>(),
  {
    closeLabel: 'Close',
    mode: 'view',
    record: null,
  },
);

const emit = defineEmits<{
  copied: [text: string];
  'update:open': [value: boolean];
}>();

const isSmallScreen = useMediaQuery('(max-width: 639px)');
const sheetId = useId();
provide('DISMISSABLE_DRAWER_ID', sheetId);

const formState = reactive<Record<string, any>>({});
const errors = reactive<Record<string, string>>({});
const touched = reactive<Record<string, boolean>>({});
const activeTab = ref('');
const submitting = ref(false);
const actionLoadingKey = ref<null | string>(null);
const pendingConfirmKey = ref<null | string>(null);
const copiedHeaderId = ref(false);

const context = computed<SchemaFieldContext>(() => ({
  form: formState,
  mode: props.mode,
  record: props.record ?? null,
}));

function resetFormValues() {
  for (const key of Object.keys(formState)) {
    Reflect.deleteProperty(formState, key);
  }
  for (const key of Object.keys(errors)) {
    Reflect.deleteProperty(errors, key);
  }
  for (const key of Object.keys(touched)) {
    Reflect.deleteProperty(touched, key);
  }

  for (const section of props.schema.sections) {
    for (const field of section.fields) {
      if (field.defaultValue !== undefined) {
        formState[field.name] = field.defaultValue;
      }
    }
  }

  if (props.schema.toInitialValues) {
    Object.assign(
      formState,
      props.schema.toInitialValues(props.record ?? null, props.mode),
    );
  } else if (props.record && typeof props.record === 'object') {
    Object.assign(formState, props.record);
  }
}

const tabs = computed(() => {
  const seen = new Map<string, string>();
  for (const section of props.schema.sections) {
    if (section.visibleWhen && !section.visibleWhen(context.value)) continue;
    if (section.tab && !seen.has(section.tab)) {
      seen.set(section.tab, section.tabLabel ?? section.tab);
    }
  }
  return [...seen.entries()].map(([value, label]) => ({ label, value }));
});

function resolveRecordIdentity(record: any): unknown {
  if (!record || typeof record !== 'object') return record;
  return record.id ?? record.version ?? record;
}

watch(
  () => [props.open, resolveRecordIdentity(props.record), props.mode] as const,
  ([isOpen], prev) => {
    pendingConfirmKey.value = null;
    if (!isOpen) return;
    resetFormValues();
    const openedNow = !prev || !prev[0];
    if (openedNow && tabs.value.length > 0) {
      activeTab.value = props.schema.defaultTab ?? tabs.value[0]?.value ?? '';
    }
  },
  { immediate: true },
);

const visibleSections = computed(() =>
  props.schema.sections.filter((sec) =>
    sec.visibleWhen ? sec.visibleWhen(context.value) : true,
  ),
);

function sectionsForTab(tabKey: string): SchemaSectionDef[] {
  return visibleSections.value.filter((sec) => sec.tab === tabKey);
}

const unTabbedSections = computed(() =>
  visibleSections.value.filter((sec) => !sec.tab),
);

function visibleActions(placement: SchemaActionDef['placement']) {
  return (props.schema.actions ?? []).filter(
    (a) =>
      a.placement === placement &&
      (a.visibleWhen ? a.visibleWhen(context.value) : true),
  );
}

const headerBarActions = computed(() => visibleActions('header-bar'));
const footerLeftActions = computed(() => visibleActions('footer-left'));
const footerRightActions = computed(() => visibleActions('footer-right'));
const showAutoFooterClose = computed(() => {
  if (props.schema.showCloseInFooter === false) return false;
  if (props.mode !== 'view') return false;
  return !footerRightActions.value.some(
    (a) => a.key === 'close' || a.key === 'cancel',
  );
});

const resolvedTitle = computed(() =>
  typeof props.schema.title === 'function'
    ? props.schema.title(context.value)
    : props.schema.title,
);

const resolvedDescription = computed(() => {
  if (!props.schema.description) return '';
  return typeof props.schema.description === 'function'
    ? props.schema.description(context.value)
    : props.schema.description;
});

const copyId = computed(() => props.schema.copyableId?.(context.value) ?? '');
const copyIdTitle = computed(() => {
  const custom = props.schema.copyableIdTitle;
  if (!custom) return copyId.value;
  return typeof custom === 'function' ? custom(context.value) : custom;
});
const metaText = computed(() => props.schema.metaText?.(context.value) ?? '');
const headerBadges = computed(() => props.schema.badges?.(context.value) ?? []);

async function handleCopyHeaderId() {
  if (!copyId.value) return;
  try {
    await navigator.clipboard.writeText(copyId.value);
    copiedHeaderId.value = true;
    emit('copied', copyId.value);
    setTimeout(() => {
      copiedHeaderId.value = false;
    }, 1500);
  } catch {
    // Ignore clipboard rejection
  }
}

function validateField(field: SchemaFieldDef): boolean {
  if (field.visibleWhen && !field.visibleWhen(context.value)) {
    Reflect.deleteProperty(errors, field.name);
    return true;
  }

  const val = formState[field.name];
  if (field.required) {
    const empty =
      val === undefined ||
      val === null ||
      (typeof val === 'string' && val.trim().length === 0);
    if (empty) {
      const label =
        typeof field.label === 'function'
          ? field.label(context.value)
          : field.label;
      errors[field.name] = `${label} is required.`;
      return false;
    }
  }

  if (field.rules) {
    if (typeof field.rules === 'function') {
      const res = field.rules(val, context.value);
      if (res !== true) {
        errors[field.name] = res;
        return false;
      }
    } else {
      const parsed = field.rules.safeParse(val);
      if (!parsed.success) {
        errors[field.name] =
          parsed.error?.issues?.[0]?.message ?? 'Invalid value.';
        return false;
      }
    }
  }

  Reflect.deleteProperty(errors, field.name);
  return true;
}

function validateAllFields(): boolean {
  let valid = true;
  for (const section of visibleSections.value) {
    for (const field of section.fields) {
      touched[field.name] = true;
      if (!validateField(field)) {
        valid = false;
      }
    }
  }
  return valid;
}

function findField(fieldName: string): SchemaFieldDef | undefined {
  for (const section of visibleSections.value) {
    const found = section.fields.find((f) => f.name === fieldName);
    if (found) return found;
  }
  return undefined;
}

function handleBlurField(fieldName: string) {
  touched[fieldName] = true;
  const field = findField(fieldName);
  if (field) validateField(field);
}

function handleUpdateField(field: SchemaFieldDef, value: unknown) {
  formState[field.name] = value;
  field.onValueChange?.(value, {
    ...context.value,
    setFieldValue(targetName: string, nextVal: any) {
      formState[targetName] = nextVal;
      if (touched[targetName]) {
        const target = findField(targetName);
        if (target) validateField(target);
      }
    },
  });
  if (touched[field.name]) {
    validateField(field);
  }
}

async function handleSubmit(closeAfter = true) {
  if (!validateAllFields()) return false;
  if (!props.schema.onSubmit) return true;
  submitting.value = true;
  try {
    await props.schema.onSubmit({ ...formState }, context.value);
    if (closeAfter) {
      emit('update:open', false);
    }
    return true;
  } finally {
    submitting.value = false;
  }
}

async function handleAction(action: SchemaActionDef) {
  if (action.submit) {
    pendingConfirmKey.value = null;
    await handleSubmit(action.closeOnSuccess !== false);
    return;
  }
  if (action.confirmLabel && pendingConfirmKey.value !== action.key) {
    pendingConfirmKey.value = action.key;
    return;
  }
  pendingConfirmKey.value = null;
  if (!action.onClick) {
    if (action.closeOnSuccess) {
      emit('update:open', false);
    }
    return;
  }
  actionLoadingKey.value = action.key;
  try {
    await action.onClick(context.value);
    if (action.closeOnSuccess) {
      emit('update:open', false);
    }
  } finally {
    actionLoadingKey.value = null;
  }
}

function actionLabel(action: SchemaActionDef): string {
  if (pendingConfirmKey.value === action.key && action.confirmLabel) {
    return typeof action.confirmLabel === 'function'
      ? action.confirmLabel(context.value)
      : action.confirmLabel;
  }
  return typeof action.label === 'function'
    ? action.label(context.value)
    : action.label;
}

function sectionActionsFor(sectionId: string): SchemaActionDef[] {
  return (props.schema.actions ?? []).filter(
    (a) => a.placement === 'section' && a.sectionId === sectionId,
  );
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      :open="open"
      modal
      :side="isSmallScreen ? 'bottom' : 'right'"
      :show-close-button="false"
      :class="
        cn(
          'flex w-full flex-col gap-0 overflow-hidden p-0',
          isSmallScreen
            ? 'max-h-[90dvh] rounded-t-xl'
            : cn('h-dvh max-h-dvh', schema.widthClass ?? 'sm:max-w-[460px]'),
        )
      "
    >
      <div
        v-if="isSmallScreen"
        aria-hidden="true"
        class="bg-muted-foreground/30 mx-auto mt-2.5 mb-0.5 h-1 w-9 shrink-0 rounded-full"
      ></div>
      <SheetHeader class="border-border shrink-0 border-b px-5 py-3.5">
        <SheetTitle class="truncate text-sm tracking-tight">
          {{ resolvedTitle }}
        </SheetTitle>
        <SheetDescription class="sr-only">
          {{ resolvedDescription || resolvedTitle }}
        </SheetDescription>
      </SheetHeader>

      <form
        class="flex min-h-0 flex-1 flex-col"
        @submit.prevent="handleSubmit(true)"
      >
        <div
          class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4"
        >
          <div
            v-if="copyId || headerBadges.length > 0 || metaText"
            class="flex flex-wrap items-center gap-2"
          >
            <button
              v-if="copyId"
              type="button"
              class="border-border text-ui-caption text-muted-foreground hover:bg-accent hover:text-foreground inline-flex shrink-0 items-center gap-1 rounded-sm border px-1.5 py-0.5 transition-colors"
              :title="copyIdTitle"
              @click="handleCopyHeaderId"
            >
              <span>{{ copyId }}</span>
              <Check v-if="copiedHeaderId" class="size-2.5 text-emerald-500" />
              <Copy v-else class="size-2.5 opacity-70" />
            </button>
            <Badge
              v-for="badge in headerBadges"
              :key="badge.label"
              :variant="badge.variant ?? 'secondary'"
              :class="cn('shrink-0', badge.class)"
            >
              {{ badge.label }}
            </Badge>
            <span
              v-if="metaText"
              class="text-ui-caption text-muted-foreground truncate"
            >
              {{ metaText }}
            </span>
          </div>
          <div v-if="headerBarActions.length > 0" class="flex flex-wrap gap-2">
            <Button
              v-for="act in headerBarActions"
              :key="act.key"
              type="button"
              size="sm"
              :variant="act.variant ?? 'outline'"
              :class="cn('gap-1.5', act.class)"
              :disabled="
                submitting ||
                actionLoadingKey === act.key ||
                act.disabledWhen?.(context)
              "
              @click="handleAction(act)"
            >
              <Loader2
                v-if="
                  actionLoadingKey === act.key || act.loadingWhen?.(context)
                "
                class="size-3.5 animate-spin"
              />
              <component :is="act.icon" v-else-if="act.icon" class="size-3.5" />
              <span>{{ actionLabel(act) }}</span>
            </Button>
          </div>

          <Tabs
            v-if="tabs.length > 0"
            v-model="activeTab"
            :unmount-on-hide="false"
            class="w-full"
          >
            <TabsList
              class="grid w-full"
              :style="{
                gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
              }"
            >
              <TabsTrigger
                v-for="tab in tabs"
                :key="tab.value"
                :value="tab.value"
                class="text-ui-label"
              >
                {{ tab.label }}
              </TabsTrigger>
            </TabsList>

            <TabsContent
              v-for="tab in tabs"
              :key="tab.value"
              :value="tab.value"
              class="mt-3 flex flex-col gap-3"
            >
              <SchemaSectionRenderer
                v-for="section in sectionsForTab(tab.value)"
                :key="section.id"
                :action-loading-key="actionLoadingKey"
                :context="context"
                :errors="errors"
                :section="section"
                :section-actions="sectionActionsFor(section.id)"
                :submitting="submitting"
                @action="handleAction"
                @blur-field="handleBlurField"
                @submit="handleSubmit(true)"
                @update-field="handleUpdateField"
              />
            </TabsContent>
          </Tabs>

          <SchemaSectionRenderer
            v-for="section in unTabbedSections"
            :key="section.id"
            :action-loading-key="actionLoadingKey"
            :context="context"
            :errors="errors"
            :section="section"
            :section-actions="sectionActionsFor(section.id)"
            :submitting="submitting"
            @action="handleAction"
            @blur-field="handleBlurField"
            @submit="handleSubmit(true)"
            @update-field="handleUpdateField"
          />
        </div>

        <SheetFooter
          v-if="
            footerLeftActions.length > 0 ||
            footerRightActions.length > 0 ||
            showAutoFooterClose
          "
          class="border-border bg-muted/25 flex shrink-0 flex-row items-center justify-between gap-2 border-t px-4 py-3 sm:px-5"
        >
          <div class="flex items-center gap-2">
            <Button
              v-for="act in footerLeftActions"
              :key="act.key"
              type="button"
              :variant="
                pendingConfirmKey === act.key
                  ? 'destructive'
                  : (act.variant ?? 'ghost')
              "
              size="sm"
              :class="
                cn(
                  'h-8 gap-1.5',
                  pendingConfirmKey === act.key ? '' : act.class,
                )
              "
              :disabled="
                submitting ||
                actionLoadingKey === act.key ||
                act.disabledWhen?.(context)
              "
              @click="handleAction(act)"
            >
              <Loader2
                v-if="
                  actionLoadingKey === act.key || act.loadingWhen?.(context)
                "
                class="size-3.5 animate-spin"
              />
              <component :is="act.icon" v-else-if="act.icon" class="size-3.5" />
              <span>{{ actionLabel(act) }}</span>
            </Button>
          </div>

          <div class="flex items-center gap-2">
            <Button
              v-if="showAutoFooterClose"
              type="button"
              variant="outline"
              size="sm"
              class="h-8"
              :aria-label="closeLabel"
              @click="emit('update:open', false)"
            >
              {{ closeLabel }}
            </Button>
            <Button
              v-for="act in footerRightActions"
              :key="act.key"
              :type="act.submit ? 'submit' : 'button'"
              :variant="
                pendingConfirmKey === act.key
                  ? 'destructive'
                  : (act.variant ?? (act.submit ? 'default' : 'outline'))
              "
              size="sm"
              :class="
                cn(
                  'h-8 gap-1.5',
                  pendingConfirmKey === act.key ? '' : act.class,
                )
              "
              :disabled="
                submitting ||
                actionLoadingKey === act.key ||
                act.disabledWhen?.(context)
              "
              @click="!act.submit && handleAction(act)"
            >
              <Loader2
                v-if="
                  (act.submit && submitting) ||
                  actionLoadingKey === act.key ||
                  act.loadingWhen?.(context)
                "
                class="size-3.5 animate-spin"
              />
              <component :is="act.icon" v-else-if="act.icon" class="size-3.5" />
              <span>{{ actionLabel(act) }}</span>
            </Button>
          </div>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
</template>
