<script lang="ts" setup>
import type { VxeDetailSheetOptions } from './types';

import type { EffectiveAccess } from '#/api/core/access';
import type {
  DynamicVxeFormField,
  SupabaseResourceKey,
} from '#/api/core/supabase-schema-registry';

import { computed, reactive, ref, watch } from 'vue';

import { VxeForm, VxeFormItem } from '@vben/plugins/vxe-table';
import { usePreferences } from '@vben/preferences';

import {
  Check,
  Copy,
  Database,
  Edit3,
  FileJson,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
} from '@lucide/vue';
import {
  Badge,
  Button,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
  Textarea,
  toast,
} from '@tuquet/vue-ui';

import { getEffectiveAccessApi } from '#/api/core/access';
import {
  buildDynamicVxeFormSchema,
  computeDirtyMutablePayload,
  executeDynamicSupabasePatch,
  inferResourceFromRouteAndRow,
} from '#/api/core/supabase-schema-registry';
import { useClipboard, useDateFormat } from '#/composables';
import { $t } from '#/locales';

interface Props {
  gridColumns?: Array<{ field?: string; title?: string }>;
  open: boolean;
  options?: VxeDetailSheetOptions<any>;
  routePath?: string;
  row: null | Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  gridColumns: () => [],
  options: undefined,
  routePath: '',
});

const emit = defineEmits<{
  saved: [updatedRow: Record<string, any>];
  'update:open': [value: boolean];
}>();

const { isMobile } = usePreferences();
const { copyToClipboard, isCopied } = useClipboard();
const { formatDate } = useDateFormat();

const effectiveAccess = ref<EffectiveAccess | null>(null);
const saving = ref(false);
const formData = reactive<Record<string, any>>({});

async function ensureEffectiveAccess() {
  if (effectiveAccess.value) {
    return;
  }
  try {
    effectiveAccess.value = await getEffectiveAccessApi();
  } catch {
    // Fallback to null (optimistic UI; backend RLS enforces policy)
    effectiveAccess.value = null;
  }
}

const resolvedResource = computed<SupabaseResourceKey>(() => {
  const currentPath =
    props.routePath ||
    (typeof window === 'undefined' ? '' : window.location.pathname);
  return inferResourceFromRouteAndRow(
    currentPath,
    props.row,
    props.options?.resource,
  );
});

const dynamicSchema = computed(() => {
  return buildDynamicVxeFormSchema({
    access: effectiveAccess.value,
    gridColumns: props.gridColumns,
    resource: resolvedResource.value,
    row: props.row,
    translate: (key: string) => $t(key),
  });
});

const editableFields = computed<DynamicVxeFormField[]>(() =>
  dynamicSchema.value.fields.filter((f) => f.group === 'editable'),
);

const readonlyFields = computed<DynamicVxeFormField[]>(() =>
  dynamicSchema.value.fields.filter((f) => f.group === 'readonly'),
);

const jsonFields = computed<DynamicVxeFormField[]>(() =>
  dynamicSchema.value.fields.filter((f) => f.group === 'json'),
);

function syncFormDataFromRow(row: null | Record<string, any>) {
  for (const key of Object.keys(formData)) {
    Reflect.deleteProperty(formData, key);
  }
  if (!row) {
    return;
  }
  for (const [key, val] of Object.entries(row)) {
    if (key.startsWith('_X_ROW')) continue;
    formData[key] =
      val && typeof val === 'object' && !Array.isArray(val)
        ? JSON.stringify(val, null, 2)
        : val;
  }
}

watch(
  () => [props.open, props.row] as const,
  ([isOpen, currentRow]) => {
    if (isOpen && currentRow) {
      syncFormDataFromRow(currentRow);
      void ensureEffectiveAccess();
    }
  },
  { immediate: true },
);

function formatReadonlyValue(field: DynamicVxeFormField): string {
  const raw = props.row?.[field.field];
  if (raw === undefined || raw === null || raw === '') {
    return '—';
  }
  if (field.type === 'datetime') {
    return formatDate(String(raw));
  }
  if (field.type === 'boolean') {
    return raw ? $t('common.yes') : $t('common.no');
  }
  if (field.type === 'number' && typeof raw === 'number') {
    return raw.toLocaleString();
  }
  return String(raw);
}

function formatJsonPreview(field: string): string {
  const raw = props.row?.[field];
  if (raw === undefined || raw === null) {
    return '{}';
  }
  if (typeof raw === 'string') {
    return raw;
  }
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return String(raw);
  }
}

function isCopyableIdentifier(field: DynamicVxeFormField): boolean {
  return (
    field.type === 'uuid' ||
    field.field === 'id' ||
    field.field.endsWith('_id') ||
    field.field.endsWith('_code') ||
    field.field === 'slug' ||
    field.field === 'host' ||
    field.field === 'ip_address'
  );
}

async function handleSave() {
  if (!props.row || saving.value) {
    return;
  }
  const resource = resolvedResource.value;
  const dirtyPayload = computeDirtyMutablePayload(
    props.row,
    formData,
    resource,
  );

  if (Object.keys(dirtyPayload).length === 0 && !props.options?.onSave) {
    toast.info($t('common.noChangesToSave'));
    return;
  }

  saving.value = true;
  try {
    if (props.options?.onSave) {
      await props.options.onSave({
        dirtyPayload,
        formData: { ...formData },
        resource,
        row: props.row,
      });
      const updated = { ...props.row, ...dirtyPayload };
      await props.options?.onSaved?.(updated);
      emit('saved', updated);
    } else {
      const result = await executeDynamicSupabasePatch(
        resource,
        props.row,
        formData,
        effectiveAccess.value,
      );
      await props.options?.onSaved?.(result.updatedRow);
      emit('saved', result.updatedRow);
    }
    toast.success($t('common.savedSuccessfully'));
    emit('update:open', false);
  } catch (error: any) {
    toast.error(error?.message || $t('common.error'));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Sheet :open="props.open" @update:open="(val) => emit('update:open', val)">
    <SheetContent
      :side="isMobile ? 'bottom' : 'right'"
      :class="
        isMobile
          ? 'flex max-h-[88vh] w-full flex-col rounded-t-2xl border-t border-border/80 p-0'
          : 'flex h-full w-full flex-col border-l border-border/80 p-0 sm:max-w-lg'
      "
    >
      <!-- Sheet Header with Dynamic Title, Schema Badge & RLS Policy Badge -->
      <SheetHeader
        class="shrink-0 space-y-2 border-b border-border/60 bg-muted/20 px-4 py-3.5 text-left sm:px-5"
      >
        <div class="flex flex-wrap items-center gap-1.5 pr-6">
          <span
            class="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background px-2 py-0.5 font-mono text-2xs text-muted-foreground"
          >
            <Database class="size-3 shrink-0 text-primary" />
            {{ dynamicSchema.rls.resource }}
          </span>

          <span
            v-if="
              dynamicSchema.rls.canUpdate.allowed && editableFields.length > 0
            "
            class="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-2xs font-medium text-emerald-600 dark:text-emerald-400"
          >
            <ShieldCheck class="size-3 shrink-0" />
            {{ $t('common.rlsWritable') }} ·
            <span class="font-mono">{{
              dynamicSchema.rls.canUpdate.policyName
            }}</span>
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-2xs font-medium text-amber-600 dark:text-amber-400"
          >
            <Lock class="size-3 shrink-0" />
            {{ $t('common.rlsReadOnly') }} ·
            <span class="font-mono">{{
              dynamicSchema.rls.canUpdate.policyName
            }}</span>
          </span>
        </div>

        <SheetTitle class="truncate text-base font-semibold tracking-tight">
          {{ dynamicSchema.title }}
        </SheetTitle>

        <SheetDescription class="text-xs text-muted-foreground">
          {{
            dynamicSchema.rls.canUpdate.reasonKey
              ? $t(dynamicSchema.rls.canUpdate.reasonKey)
              : $t('common.detailSheetTitle')
          }}
        </SheetDescription>
      </SheetHeader>

      <!-- Scrollable Sheet Body powered by VxeForm -->
      <div
        v-if="props.row"
        class="flex-1 space-y-4 overflow-y-auto px-4 py-3.5 sm:px-5"
      >
        <!-- Section 1: Editable Fields via VxeForm -->
        <div
          v-if="editableFields.length > 0"
          class="rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs"
        >
          <div
            class="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-foreground"
          >
            <Edit3 class="size-3.5 text-primary" />
            <span>{{ $t('common.detailSheetEditableSection') }}</span>
          </div>

          <VxeForm
            :data="formData"
            custom-layout
            size="small"
            class="w-full space-y-2.5"
          >
            <VxeFormItem
              v-for="field in editableFields"
              :key="field.field"
              :field="field.field"
              :title="field.title"
              span="24"
            >
              <template #default>
                <!-- Enum Select -->
                <select
                  v-if="field.type === 'enum' && field.options?.length"
                  v-model="formData[field.field]"
                  :data-testid="`vxe-field-${field.field}`"
                  class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option
                    v-for="opt in field.options"
                    :key="String(opt.value)"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>

                <!-- Boolean Switch -->
                <div
                  v-else-if="field.type === 'boolean'"
                  class="flex h-9 items-center justify-between rounded-md border border-border/60 bg-muted/20 px-3"
                >
                  <span class="text-xs text-foreground">
                    {{
                      formData[field.field]
                        ? $t('common.enabled')
                        : $t('common.disabled')
                    }}
                  </span>
                  <Switch
                    :checked="Boolean(formData[field.field])"
                    :data-testid="`vxe-field-${field.field}`"
                    @update:checked="
                      (val: boolean) => (formData[field.field] = val)
                    "
                  />
                </div>

                <!-- Multiline Textarea -->
                <Textarea
                  v-else-if="field.type === 'textarea'"
                  v-model="formData[field.field]"
                  :data-testid="`vxe-field-${field.field}`"
                  rows="3"
                  class="text-xs"
                />

                <!-- Number Input -->
                <Input
                  v-else-if="field.type === 'number'"
                  v-model.number="formData[field.field]"
                  :data-testid="`vxe-field-${field.field}`"
                  :max="field.max"
                  :min="field.min"
                  type="number"
                  class="h-9 text-xs"
                />

                <!-- Default Text Input -->
                <Input
                  v-else
                  v-model="formData[field.field]"
                  :data-testid="`vxe-field-${field.field}`"
                  class="h-9 text-xs"
                />
              </template>
            </VxeFormItem>
          </VxeForm>
        </div>

        <!-- Section 2: System & Identity Read-Only Metadata via VxeForm -->
        <div
          v-if="readonlyFields.length > 0"
          class="rounded-xl border border-border/60 bg-muted/20 p-3.5"
        >
          <div
            class="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-foreground"
          >
            <Database class="size-3.5 text-muted-foreground" />
            <span>{{ $t('common.detailSheetMetadataSection') }}</span>
          </div>

          <VxeForm
            :data="props.row"
            custom-layout
            readonly
            size="small"
            class="w-full"
          >
            <VxeFormItem
              v-for="field in readonlyFields"
              :key="field.field"
              :field="field.field"
              :title="field.title"
              :span="
                field.type === 'uuid' ||
                field.type === 'textarea' ||
                field.field === 'id'
                  ? 24
                  : 12
              "
            >
              <template #default>
                <!-- Semantic Enum Status Badge -->
                <div
                  v-if="field.statusMeta"
                  class="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium"
                  :class="field.statusMeta.badgeClass"
                >
                  <span
                    class="size-1.5 rounded-full"
                    :class="field.statusMeta.dotClass"
                  ></span>
                  <span>
                    {{
                      field.statusMeta.labelKey
                        ? $t(field.statusMeta.labelKey)
                        : field.statusMeta.fallbackLabel
                    }}
                  </span>
                </div>

                <!-- Copyable Identifier / UUID / Code -->
                <div
                  v-else-if="
                    isCopyableIdentifier(field) && props.row[field.field]
                  "
                  class="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/80 px-2.5 py-1 font-mono text-xs text-foreground"
                >
                  <span class="truncate">{{ props.row[field.field] }}</span>
                  <button
                    type="button"
                    class="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    :title="$t('common.copy')"
                    @click="
                      copyToClipboard(
                        String(props.row[field.field]),
                        field.title,
                      )
                    "
                  >
                    <Check
                      v-if="isCopied(field.title)"
                      class="size-3.5 text-emerald-500"
                    />
                    <Copy v-else class="size-3.5" />
                  </button>
                </div>

                <!-- Default Read-Only Scalar -->
                <div
                  v-else
                  class="truncate text-xs font-medium text-foreground"
                >
                  {{ formatReadonlyValue(field) }}
                </div>
              </template>
            </VxeFormItem>
          </VxeForm>

          <!-- Relational Array Summaries (Permissions, Roles, Dependencies, Workspaces) -->
          <div
            v-if="
              Array.isArray(props.row.permissions) &&
              props.row.permissions.length > 0
            "
            class="mt-3 border-t border-border/50 pt-3"
          >
            <div class="mb-1.5 text-2xs font-medium text-muted-foreground">
              {{ $t('term.permissions') }} ({{ props.row.permissions.length }})
            </div>
            <div class="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1">
              <button
                v-for="perm in props.row.permissions"
                :key="perm"
                type="button"
                class="inline-flex items-center gap-1 rounded border border-border/60 bg-background px-2 py-0.5 font-mono text-2xs text-foreground transition-colors hover:bg-muted"
                :title="$t('common.copy')"
                @click="copyToClipboard(String(perm), String(perm))"
              >
                <span>{{ perm }}</span>
                <Copy class="size-2.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div
            v-if="Array.isArray(props.row.roles) && props.row.roles.length > 0"
            class="mt-3 border-t border-border/50 pt-3"
          >
            <div class="mb-1.5 text-2xs font-medium text-muted-foreground">
              {{ $t('page.system_view.roles_col_assigned_roles') }} ({{
                props.row.roles.length
              }})
            </div>
            <div class="flex flex-wrap gap-1.5">
              <Badge
                v-for="roleName in props.row.roles"
                :key="roleName"
                variant="outline"
                class="font-mono text-2xs font-medium"
              >
                {{ roleName }}
              </Badge>
            </div>
          </div>

          <div
            v-if="
              Array.isArray(props.row.dependencies) &&
              props.row.dependencies.length > 0
            "
            class="mt-3 border-t border-border/50 pt-3"
          >
            <div class="mb-1.5 text-2xs font-medium text-muted-foreground">
              {{ $t('common.module') }} ({{ props.row.dependencies.length }})
            </div>
            <div class="flex flex-wrap gap-1.5">
              <Badge
                v-for="dep in props.row.dependencies"
                :key="dep"
                variant="secondary"
                class="font-mono text-2xs font-normal"
              >
                {{ dep }}
              </Badge>
            </div>
          </div>

          <div
            v-if="
              Array.isArray(props.row.workspaces) &&
              props.row.workspaces.length > 0
            "
            class="mt-3 border-t border-border/50 pt-3"
          >
            <div class="mb-1.5 text-2xs font-medium text-muted-foreground">
              {{
                $t('page.system_view.users_orgs_header', [
                  props.row.workspaces.length,
                ])
              }}
            </div>
            <div class="max-h-40 space-y-1.5 overflow-y-auto pr-1">
              <div
                v-for="ws in props.row.workspaces"
                :key="ws.tenant_id"
                class="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs"
              >
                <div class="min-w-0">
                  <div class="truncate font-medium text-foreground">
                    {{ ws.tenant_name }}
                  </div>
                  <div
                    class="truncate font-mono text-2xs text-muted-foreground"
                  >
                    /{{ ws.tenant_slug || String(ws.tenant_id).slice(0, 8) }}
                  </div>
                </div>
                <Badge variant="outline" class="shrink-0 font-mono text-2xs">
                  {{ ws.role_name }}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Structured JSON Payload Inspector / Editor -->
        <div
          v-if="jsonFields.length > 0"
          class="rounded-xl border border-border/60 bg-muted/20 p-3.5"
        >
          <div
            class="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-foreground"
          >
            <FileJson class="size-3.5 text-muted-foreground" />
            <span>{{ $t('common.detailSheetJsonSection') }}</span>
          </div>

          <VxeForm
            :data="formData"
            custom-layout
            size="small"
            class="w-full space-y-2.5"
          >
            <VxeFormItem
              v-for="field in jsonFields"
              :key="field.field"
              :field="field.field"
              :title="field.title"
              span="24"
            >
              <template #default>
                <Textarea
                  v-if="field.editable"
                  v-model="formData[field.field]"
                  :data-testid="`vxe-field-${field.field}`"
                  rows="4"
                  class="font-mono text-xs"
                />
                <div v-else class="relative">
                  <pre
                    class="max-h-44 overflow-auto rounded-lg border border-border/60 bg-background p-2.5 font-mono text-2xs text-foreground"
                    >{{ formatJsonPreview(field.field) }}</pre>
                  <button
                    type="button"
                    class="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded border border-border/60 bg-muted/80 text-muted-foreground hover:text-foreground"
                    :title="$t('common.copy')"
                    @click="
                      copyToClipboard(
                        formatJsonPreview(field.field),
                        field.title,
                      )
                    "
                  >
                    <Copy class="size-3" />
                  </button>
                </div>
              </template>
            </VxeFormItem>
          </VxeForm>
        </div>
      </div>

      <!-- Sheet Footer with Auto-Forwarded Row Actions + Save/Close -->
      <SheetFooter
        v-if="props.row"
        class="shrink-0 flex-col gap-2.5 border-t border-border/60 bg-muted/20 px-4 py-3 sm:flex-col sm:space-x-0 sm:px-5"
      >
        <!-- Row Actions Bar (Auto-forwarded from Grid Action Slot + Declarative Actions) -->
        <div
          class="flex w-full flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5"
        >
          <span class="text-2xs font-medium text-muted-foreground">
            {{ $t('common.detailSheetActionsSection') }}
          </span>
          <div class="flex flex-wrap items-center gap-1.5">
            <slot name="row-actions" :row="props.row"></slot>

            <Button
              v-for="(act, idx) in props.options?.actions || []"
              :key="idx"
              :variant="act.variant || 'outline'"
              :disabled="act.disabled?.(props.row)"
              size="sm"
              class="h-7 gap-1 px-2.5 text-xs"
              @click="(act.handler ?? act.onClick)?.(props.row)"
            >
              <component :is="act.icon" v-if="act.icon" class="size-3.5" />
              <span>{{ act.label }}</span>
            </Button>

            <Button
              v-if="props.row.id"
              variant="ghost"
              size="sm"
              class="h-7 gap-1 px-2 text-xs text-muted-foreground"
              @click="copyToClipboard(String(props.row.id), 'ID')"
            >
              <Copy class="size-3" />
              <span>ID</span>
            </Button>
          </div>
        </div>

        <!-- Primary Form Submit / Close Buttons -->
        <div class="flex w-full items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            class="h-9 px-3.5 text-xs"
            @click="emit('update:open', false)"
          >
            {{ $t('common.close') }}
          </Button>
          <Button
            v-if="
              editableFields.length > 0 && dynamicSchema.rls.canUpdate.allowed
            "
            size="sm"
            class="h-9 gap-1.5 px-4 text-xs font-medium"
            :disabled="saving"
            data-testid="vxe-detail-sheet-save"
            @click="handleSave"
          >
            <Loader2 v-if="saving" class="size-3.5 animate-spin" />
            <Save v-else class="size-3.5" />
            <span>{{ $t('common.saveChanges') }}</span>
          </Button>
        </div>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
