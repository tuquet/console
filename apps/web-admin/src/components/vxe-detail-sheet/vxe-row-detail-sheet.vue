<script lang="ts" setup>
import type { VxeDetailSheetOptions } from './types';

import type { EffectiveAccess } from '#/api/core/access';
import type {
  DynamicVxeFormField,
  SupabaseResourceKey,
} from '#/api/core/supabase-schema-registry';

import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { VxeForm, VxeFormItem } from '@vben/plugins/vxe-table';
import { usePreferences } from '@vben/preferences';

import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  Copy,
  Cpu,
  CreditCard,
  Edit3,
  FileJson,
  Folder,
  Globe,
  KeyRound,
  Layers,
  Loader2,
  Puzzle,
  Save,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wallet,
  Workflow,
} from '@lucide/vue';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
import RoleBadge from '#/components/iam/role-badge.vue';
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

const router = useRouter();
const { isMobile } = usePreferences();
const { copyToClipboard, isCopied } = useClipboard();
const { formatDate } = useDateFormat();

const effectiveAccess = ref<EffectiveAccess | null>(null);
const saving = ref(false);
const isEditing = ref(false);
const formData = reactive<Record<string, any>>({});

async function ensureEffectiveAccess() {
  if (effectiveAccess.value) {
    return;
  }
  try {
    effectiveAccess.value = await getEffectiveAccessApi();
  } catch {
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
  dynamicSchema.value.fields.filter((f) => f.editable),
);

const canEditRow = computed<boolean>(
  () =>
    dynamicSchema.value.rls.canUpdate.allowed &&
    editableFields.value.length > 0,
);

function resolveFieldRawValue(field: DynamicVxeFormField): unknown {
  const row = props.row;
  if (!row) return undefined;
  if (field.field in row && row[field.field] !== undefined) {
    return row[field.field];
  }
  return field.value;
}

const viewScalarFields = computed<DynamicVxeFormField[]>(() => {
  const row = props.row;
  if (!row) return [];
  return dynamicSchema.value.fields.filter((f) => {
    if (f.group === 'json') return false;
    // Avatar is already rendered in the Identity Header
    if (f.field === 'avatar_url') return false;
    const val = resolveFieldRawValue(f);
    return val !== undefined && val !== null && val !== '';
  });
});

function hasNonEmptyJson(raw: unknown): boolean {
  if (!raw) return false;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return Boolean(trimmed && trimmed !== '{}' && trimmed !== 'null');
  }
  if (typeof raw === 'object') {
    return Object.keys(raw as Record<string, any>).length > 0;
  }
  return false;
}

const visibleJsonFields = computed<DynamicVxeFormField[]>(() =>
  dynamicSchema.value.fields.filter(
    (f) => f.group === 'json' && hasNonEmptyJson(props.row?.[f.field]),
  ),
);

const isUserProfile = computed(
  () =>
    resolvedResource.value === 'public.profiles' ||
    Boolean(
      props.row && ('avatar_url' in props.row || 'full_name' in props.row),
    ),
);

const resourceIcon = computed(() => {
  switch (resolvedResource.value) {
    case 'automa.campaign_runs':
    case 'runners.devices': {
      return Cpu;
    }
    case 'automa.workflows': {
      return Workflow;
    }
    case 'billing.payment_gateways':
    case 'billing.payment_intents':
    case 'billing.subscriptions': {
      return CreditCard;
    }
    case 'billing.plans': {
      return Layers;
    }
    case 'billing.wallet_transactions': {
      return Wallet;
    }
    case 'commerce.orders':
    case 'commerce.products': {
      return ShoppingBag;
    }
    case 'public.audit_logs': {
      return ShieldCheck;
    }
    case 'public.permissions':
    case 'public.roles': {
      return KeyRound;
    }
    case 'public.profiles': {
      return Users;
    }
    case 'public.system_plugins': {
      return Puzzle;
    }
    case 'runners.browsers':
    case 'runners.proxies': {
      return Globe;
    }
    default: {
      return Building2;
    }
  }
});

const headerStatusField = computed<DynamicVxeFormField | undefined>(() => {
  return dynamicSchema.value.fields.find(
    (f) =>
      f.statusMeta &&
      (f.field === 'status' ||
        f.field === 'primary_role' ||
        f.field === 'tx_type'),
  );
});

const headerSubtitle = computed<string>(() => {
  const row = props.row;
  if (!row) return '';
  switch (resolvedResource.value) {
    case 'billing.plans': {
      const price =
        row.price_monthly_usd === 0
          ? $t('page.system_view.plans_free')
          : `$${Number(row.price_monthly_usd ?? 0).toLocaleString()}${$t('page.system_view.per_month_suffix')}`;
      return row.description ? `${price} · ${row.description}` : price;
    }
    case 'billing.subscriptions': {
      const planLabel = row.plan_name || row.plan_id || '';
      const price = `$${Number(row.price_monthly_usd ?? 0).toLocaleString()}${$t('page.system_view.per_month_suffix')}`;
      return planLabel ? `${planLabel} · ${price}` : price;
    }
    case 'public.audit_logs': {
      const parts = [
        row.entity_type,
        row.created_at ? formatDate(String(row.created_at)) : '',
      ].filter(Boolean);
      return parts.join(' · ');
    }
    case 'public.permissions': {
      return row.description || `${$t('common.module')}: ${row.module || '—'}`;
    }
    case 'public.profiles': {
      return String(row.email || '');
    }
    case 'public.roles': {
      return String(
        row.description ||
          (row.is_system
            ? $t('common.rlsSystemRoleImmutable')
            : $t('page.system_view.roles_type_custom')),
      );
    }
    case 'public.system_plugins': {
      const kind = row.is_core
        ? $t('page.system_view.plugins_type_core')
        : $t('page.system_view.plugins_type_extension');
      return `v${row.version || '1.0.0'} · ${kind}`;
    }
    default: {
      if (
        props.options?.subtitleField &&
        row[String(props.options.subtitleField)]
      ) {
        return String(row[String(props.options.subtitleField)]);
      }
      return String(
        row.description ||
          row.short_description ||
          row.email ||
          row.buyer_email ||
          (row.slug ? `/${row.slug}` : '') ||
          '',
      );
    }
  }
});

const groupedRolePermissions = computed<Record<string, string[]>>(() => {
  const perms = props.row?.permissions;
  if (!Array.isArray(perms) || perms.length === 0) {
    return {};
  }
  const groups: Record<string, string[]> = {};
  for (const rawPerm of perms) {
    const perm = String(rawPerm);
    const prefix = perm.split(/[:.]/)[0] || 'core-iam';
    if (!groups[prefix]) {
      groups[prefix] = [];
    }
    groups[prefix].push(perm);
  }
  return groups;
});

function getInitials(name: null | string | undefined): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

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
  for (const field of dynamicSchema.value.fields) {
    if (!(field.field in formData) && field.value !== undefined) {
      formData[field.field] = field.value;
    }
  }
}

watch(
  () => [props.open, props.row] as const,
  ([isOpen, currentRow]) => {
    if (isOpen && currentRow) {
      isEditing.value = false;
      syncFormDataFromRow(currentRow);
      void ensureEffectiveAccess();
    } else if (!isOpen) {
      isEditing.value = false;
    }
  },
  { immediate: true },
);

watch(
  () => router.currentRoute.value.fullPath,
  () => {
    if (props.open) {
      emit('update:open', false);
    }
  },
);

function startEditing() {
  syncFormDataFromRow(props.row);
  isEditing.value = true;
}

function cancelEditing() {
  syncFormDataFromRow(props.row);
  isEditing.value = false;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${Number((mb / 1024).toFixed(1))} GB`;
  }
  if (mb >= 1) {
    return `${Math.round(mb)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDisplayValue(field: DynamicVxeFormField): string {
  const raw = resolveFieldRawValue(field);
  if (raw === undefined || raw === null || raw === '') {
    return '—';
  }
  if (field.field === 'price_monthly_usd') {
    const num = Number(raw);
    if (num === 0) return $t('page.system_view.plans_free');
    return `$${num.toLocaleString()}${$t('page.system_view.per_month_suffix')}`;
  }
  if (field.field === 'max_storage_mb') {
    const mb = Number(raw);
    if (mb >= 1024) {
      return `${Number((mb / 1024).toFixed(1))} GB`;
    }
    return `${mb} MB`;
  }
  if (field.field === 'storage_size_bytes') {
    return formatBytes(Number(raw));
  }
  if (field.field === 'ram_gb') {
    return `${raw} GB`;
  }
  if (field.field === 'cpu_cores') {
    return `${raw} vCPU`;
  }
  if (field.field === 'max_members') {
    return $t('page.system_view.plans_members_unit', [raw]);
  }
  if (field.field === 'max_monthly_runs') {
    return $t('page.system_view.plans_runs_unit', [
      Number(raw).toLocaleString(),
    ]);
  }
  if (field.field === 'latency_ms') {
    return `${raw} ms`;
  }
  if (
    field.field === 'amount_credits' ||
    field.field === 'total_credits' ||
    field.field === 'balance_after' ||
    field.field === 'balance_after_credits' ||
    field.field === 'credits_amount'
  ) {
    return `${Number(raw).toLocaleString()} Xu`;
  }
  if (field.field === 'pay_amount' || field.field === 'amount_original') {
    const currency =
      props.row?.pay_currency || props.row?.currency_original || '';
    const formatted = Number(raw).toLocaleString();
    return currency ? `${formatted} ${currency}` : formatted;
  }
  if (field.field === 'rate_per_credit') {
    const currency = props.row?.currency || '';
    const formatted = Number(raw).toLocaleString();
    return currency ? `${formatted} ${currency}` : formatted;
  }
  if (field.field === 'cancel_at_period_end') {
    return raw
      ? $t('page.system_view.subs_cancel_period_end')
      : $t('page.system_view.subs_auto_renew');
  }
  if (field.field === 'is_active') {
    return raw
      ? $t('page.system_view.plans_badge_active')
      : $t('page.system_view.status_paused');
  }
  if (field.field === 'is_core') {
    return raw
      ? $t('page.system_view.plugins_type_core')
      : $t('page.system_view.plugins_type_extension');
  }
  if (field.field === 'is_system') {
    return raw
      ? $t('page.system_view.roles_type_system')
      : $t('page.system_view.roles_type_custom');
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
    field.field === 'machine_fingerprint' ||
    field.field === 'slug' ||
    field.field === 'host' ||
    field.field === 'ip_address'
  );
}

function handleNavigateWorkspace(tenantId: string) {
  if (!tenantId) return;
  emit('update:open', false);
  router.push(`/tenants/${tenantId}`);
}

function handleNavigateCampaignRun(runId: string) {
  if (!runId) return;
  emit('update:open', false);
  router.push(`/automation/runs/${runId}`);
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
    isEditing.value = false;
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
    isEditing.value = false;
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
          ? 'tuquet-detail-sheet-content z-[2001] flex max-h-[88vh] w-full flex-col rounded-t-2xl border-t border-border/80 p-0'
          : 'tuquet-detail-sheet-content z-[2001] flex h-full w-full flex-col border-l border-border/80 p-0 sm:max-w-lg'
      "
    >
      <!-- Product Identity Header -->
      <SheetHeader
        class="shrink-0 border-b border-border/60 bg-muted/20 px-4 py-4 text-left sm:px-5"
      >
        <div class="flex items-start gap-3 pr-6">
          <Avatar
            v-if="isUserProfile"
            class="size-10 shrink-0 rounded-xl border border-border/60"
          >
            <AvatarImage
              v-if="props.row?.avatar_url"
              :src="props.row.avatar_url"
              :alt="dynamicSchema.title"
            />
            <AvatarFallback
              class="rounded-xl bg-muted text-xs font-semibold text-foreground"
            >
              {{ getInitials(dynamicSchema.title) }}
            </AvatarFallback>
          </Avatar>

          <div
            v-else
            class="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-foreground shadow-2xs"
          >
            <component :is="resourceIcon" class="size-4.5 text-primary" />
          </div>

          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <SheetTitle
                class="truncate text-base font-semibold tracking-tight text-foreground"
              >
                {{ dynamicSchema.title }}
              </SheetTitle>

              <span
                v-if="headerStatusField?.statusMeta"
                class="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-2xs font-medium"
                :class="headerStatusField.statusMeta.badgeClass"
              >
                <span
                  class="size-1.5 rounded-full"
                  :class="headerStatusField.statusMeta.dotClass"
                ></span>
                <span>
                  {{
                    headerStatusField.statusMeta.labelKey
                      ? $t(headerStatusField.statusMeta.labelKey)
                      : headerStatusField.statusMeta.fallbackLabel
                  }}
                </span>
              </span>

              <Badge
                v-else-if="props.row && 'is_active' in props.row"
                variant="outline"
                class="text-2xs font-normal"
              >
                <span
                  class="mr-1.5 size-1.5 rounded-full"
                  :class="
                    props.row.is_active ? 'bg-success' : 'bg-muted-foreground'
                  "
                ></span>
                {{
                  props.row.is_active
                    ? $t('page.system_view.plans_badge_active')
                    : $t('page.system_view.status_paused')
                }}
              </Badge>
            </div>

            <SheetDescription
              v-if="headerSubtitle"
              class="line-clamp-2 text-xs text-muted-foreground"
            >
              {{ headerSubtitle }}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <!-- Scrollable Drawer Body -->
      <div
        v-if="props.row"
        class="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5"
      >
        <!-- MODE A: Clean Product Inspector (Default View Mode) -->
        <template v-if="!isEditing">
          <!-- 1. Unified Business Properties List -->
          <div
            v-if="viewScalarFields.length > 0"
            class="divide-y divide-border/50 rounded-xl border border-border/60 bg-card px-4 py-1 shadow-2xs"
          >
            <div
              v-for="field in viewScalarFields"
              :key="field.field"
              class="flex items-start justify-between gap-4 py-2.5 text-xs"
            >
              <span class="shrink-0 text-muted-foreground">
                {{ field.title }}
              </span>

              <div class="min-w-0 flex-1 text-right">
                <!-- Semantic Enum Badge -->
                <span
                  v-if="field.statusMeta"
                  class="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-2xs font-medium"
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
                </span>

                <!-- Copyable Identifier / Code / IP / UUID -->
                <button
                  v-else-if="
                    isCopyableIdentifier(field) && resolveFieldRawValue(field)
                  "
                  type="button"
                  class="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 font-mono text-2xs text-foreground transition-colors hover:bg-muted"
                  :title="$t('common.copy')"
                  @click="
                    copyToClipboard(
                      String(resolveFieldRawValue(field)),
                      field.title,
                    )
                  "
                >
                  <span class="truncate">{{
                    resolveFieldRawValue(field)
                  }}</span>
                  <Check
                    v-if="isCopied(field.title)"
                    class="size-3 shrink-0 text-emerald-500"
                  />
                  <Copy v-else class="size-3 shrink-0 text-muted-foreground" />
                </button>

                <!-- Formatted Business Value -->
                <span
                  v-else
                  class="wrap-break-word font-medium text-foreground"
                >
                  {{ formatDisplayValue(field) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 2. Relational: User Workspaces (Interactive Navigation Cards) -->
          <div
            v-if="
              Array.isArray(props.row.workspaces) &&
              props.row.workspaces.length > 0
            "
            class="space-y-2 rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs"
          >
            <div class="text-xs font-semibold text-foreground">
              {{
                $t('page.system_view.users_orgs_header', [
                  props.row.workspaces.length,
                ])
              }}
            </div>
            <div class="space-y-1.5">
              <div
                v-for="ws in props.row.workspaces"
                :key="ws.tenant_id"
                class="group flex cursor-pointer items-center justify-between gap-2.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs transition-colors hover:border-primary/40 hover:bg-muted/40"
                @click="handleNavigateWorkspace(ws.tenant_id)"
              >
                <div class="flex min-w-0 items-center gap-2.5">
                  <div
                    class="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground"
                  >
                    <Building2 class="size-3.5" />
                  </div>
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
                </div>
                <div class="flex shrink-0 items-center gap-1.5">
                  <RoleBadge :role="ws.role_name" />
                  <ArrowUpRight
                    class="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Relational: Role Permissions Grouped by Module -->
          <div
            v-if="Object.keys(groupedRolePermissions).length > 0"
            class="space-y-2.5 rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-foreground">
                {{ $t('term.permissions') }}
              </span>
              <Badge variant="secondary" class="font-mono text-2xs font-normal">
                {{ props.row.permissions?.length || 0 }}
              </Badge>
            </div>

            <div class="space-y-2">
              <div
                v-for="(perms, modName) in groupedRolePermissions"
                :key="modName"
                class="rounded-lg border border-border/60 bg-muted/15 p-2.5"
              >
                <div class="mb-2 flex items-center justify-between">
                  <div
                    class="flex items-center gap-1.5 text-xs font-medium text-foreground"
                  >
                    <Folder class="size-3.5 text-primary" />
                    <span class="capitalize">{{ modName }}</span>
                  </div>
                  <span class="font-mono text-2xs text-muted-foreground">
                    {{ perms.length }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="perm in perms"
                    :key="perm"
                    type="button"
                    class="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2 py-0.5 font-mono text-2xs text-foreground transition-colors hover:bg-muted"
                    :title="$t('common.copy')"
                    @click="copyToClipboard(perm, perm)"
                  >
                    <span>{{ perm }}</span>
                    <Check
                      v-if="isCopied(perm)"
                      class="size-2.5 text-emerald-500"
                    />
                    <Copy v-else class="size-2.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Relational: Assigned Roles on Permission -->
          <div
            v-if="Array.isArray(props.row.roles) && props.row.roles.length > 0"
            class="space-y-2 rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs"
          >
            <div class="text-xs font-semibold text-foreground">
              {{ $t('page.system_view.roles_col_assigned_roles') }} ({{
                props.row.roles.length
              }})
            </div>
            <div class="flex flex-wrap gap-1.5">
              <RoleBadge
                v-for="roleName in props.row.roles"
                :key="roleName"
                :role="roleName"
              />
            </div>
          </div>

          <!-- 5. Relational: Plugin Dependencies -->
          <div
            v-if="
              Array.isArray(props.row.dependencies) &&
              props.row.dependencies.length > 0
            "
            class="space-y-2 rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs"
          >
            <div class="text-xs font-semibold text-foreground">
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

          <!-- 6. Relational: Campaign Run Progress, Workflow & Runner -->
          <div
            v-if="
              resolvedResource === 'automa.campaign_runs' &&
              (props.row.workflow ||
                props.row.runner ||
                typeof props.row.total_tasks === 'number')
            "
            class="space-y-2.5 rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-foreground">
                {{ $t('page.runs_view.col_progress') }}
              </span>
              <span
                v-if="typeof props.row.total_tasks === 'number'"
                class="font-mono text-2xs text-muted-foreground"
              >
                {{ props.row.completed_tasks || 0 }} /
                {{ props.row.total_tasks || 0 }}
              </span>
            </div>

            <div
              v-if="
                typeof props.row.total_tasks === 'number' &&
                props.row.total_tasks > 0
              "
              class="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                class="h-full rounded-full bg-primary transition-all"
                :style="{
                  width: `${Math.min(
                    100,
                    Math.round(
                      ((props.row.completed_tasks || 0) /
                        props.row.total_tasks) *
                        100,
                    ),
                  )}%`,
                }"
              ></div>
            </div>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div
                v-if="props.row.workflow?.name"
                class="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2 text-xs"
              >
                <Workflow class="size-3.5 shrink-0 text-primary" />
                <div class="min-w-0">
                  <div class="text-2xs text-muted-foreground">
                    {{ $t('term.workflow') }}
                  </div>
                  <div class="truncate font-medium text-foreground">
                    {{ props.row.workflow.name }}
                  </div>
                </div>
              </div>

              <div
                v-if="props.row.runner?.name"
                class="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2 text-xs"
              >
                <Cpu class="size-3.5 shrink-0 text-primary" />
                <div class="min-w-0">
                  <div class="text-2xs text-muted-foreground">
                    {{ $t('term.device') }}
                  </div>
                  <div class="truncate font-medium text-foreground">
                    {{ props.row.runner.name }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 7. Relational: Browser Active Lock & Proxy Binding -->
          <div
            v-if="
              resolvedResource === 'runners.browsers' &&
              (props.row.locked_by_device || props.row.proxy)
            "
            class="grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            <div
              v-if="props.row.locked_by_device?.name"
              class="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card p-3 text-xs shadow-2xs"
            >
              <Cpu class="size-4 shrink-0 text-primary" />
              <div class="min-w-0">
                <div class="text-2xs text-muted-foreground">
                  {{ $t('common.lockedBy') }}
                </div>
                <div class="truncate font-medium text-foreground">
                  {{ props.row.locked_by_device.name }}
                </div>
              </div>
            </div>

            <div
              v-if="props.row.proxy?.host"
              class="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card p-3 text-xs shadow-2xs"
            >
              <Globe class="size-4 shrink-0 text-primary" />
              <div class="min-w-0">
                <div class="text-2xs text-muted-foreground">
                  {{ $t('term.proxy') }}
                </div>
                <div class="truncate font-mono text-2xs text-foreground">
                  {{ props.row.proxy.protocol || 'socks5' }}://{{
                    props.row.proxy.host
                  }}:{{ props.row.proxy.port }}
                </div>
              </div>
            </div>
          </div>

          <!-- 8. Relational: Commerce Product Variants -->
          <div
            v-if="
              Array.isArray(props.row.variants) && props.row.variants.length > 0
            "
            class="space-y-2 rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-foreground">
                {{ $t('common.variants') }}
              </span>
              <Badge variant="secondary" class="font-mono text-2xs font-normal">
                {{ props.row.variants.length }}
              </Badge>
            </div>
            <div class="space-y-1.5">
              <div
                v-for="variant in props.row.variants"
                :key="variant.id || variant.sku"
                class="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs"
              >
                <div class="min-w-0">
                  <div class="truncate font-medium text-foreground">
                    {{ variant.name || variant.sku }}
                  </div>
                  <div
                    v-if="variant.sku"
                    class="truncate font-mono text-2xs text-muted-foreground"
                  >
                    {{ variant.sku }}
                  </div>
                </div>
                <div class="shrink-0 text-right font-mono text-xs font-medium">
                  {{ Number(variant.price_credits || 0).toLocaleString() }} Xu
                </div>
              </div>
            </div>
          </div>

          <!-- 9. Non-Empty Structured JSON Payload -->
          <div
            v-if="visibleJsonFields.length > 0"
            class="space-y-2.5 rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs"
          >
            <div
              v-for="field in visibleJsonFields"
              :key="field.field"
              class="space-y-1.5"
            >
              <div class="flex items-center justify-between">
                <div
                  class="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                >
                  <FileJson class="size-3.5 text-muted-foreground" />
                  <span>{{ field.title }}</span>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded border border-border/60 bg-muted/40 px-2 py-0.5 text-2xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  @click="
                    copyToClipboard(formatJsonPreview(field.field), field.title)
                  "
                >
                  <Copy class="size-3" />
                  <span>{{ $t('common.copy') }}</span>
                </button>
              </div>
              <pre
                class="max-h-44 overflow-auto rounded-lg border border-border/60 bg-muted/20 p-2.5 font-mono text-2xs text-foreground"
                >{{ formatJsonPreview(field.field) }}</pre>
            </div>
          </div>
        </template>

        <!-- MODE B: Vertical Aligned VxeForm Editor (When Editing) -->
        <template v-else>
          <div
            class="rounded-xl border border-border/60 bg-card p-4 shadow-2xs"
          >
            <VxeForm
              :data="formData"
              custom-layout
              vertical
              size="small"
              class="tuquet-vxe-vertical-form w-full space-y-3"
            >
              <VxeFormItem
                v-for="field in editableFields"
                :key="field.field"
                :field="field.field"
                :title="field.title"
                span="24"
              >
                <template #default>
                  <!-- Styled Enum Select -->
                  <div
                    v-if="field.type === 'enum' && field.options?.length"
                    class="relative w-full"
                  >
                    <select
                      v-model="formData[field.field]"
                      :data-testid="`vxe-field-${field.field}`"
                      class="flex h-9 w-full appearance-none rounded-md border border-input bg-background pr-8 pl-3 text-xs text-foreground shadow-2xs transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <option
                        v-for="opt in field.options"
                        :key="String(opt.value)"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </option>
                    </select>
                    <ChevronDown
                      class="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                    />
                  </div>

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

                  <!-- JSON Editor -->
                  <Textarea
                    v-else-if="field.type === 'json'"
                    v-model="formData[field.field]"
                    :data-testid="`vxe-field-${field.field}`"
                    rows="5"
                    class="font-mono text-xs"
                  />

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
        </template>
      </div>

      <!-- Clean Single-Bar Footer -->
      <SheetFooter
        v-if="props.row"
        class="shrink-0 border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-5"
      >
        <div
          v-if="!isEditing"
          class="flex w-full flex-wrap items-center justify-between gap-2"
        >
          <div class="flex flex-wrap items-center gap-1.5">
            <slot name="row-actions" :row="props.row"></slot>

            <!-- Contextual Quick-Navigation for Workspace / Subscription -->
            <Button
              v-if="
                (resolvedResource === 'public.tenants' && props.row.id) ||
                (resolvedResource === 'billing.subscriptions' &&
                  props.row.tenant_id)
              "
              variant="outline"
              size="sm"
              class="h-8 gap-1.5 px-2.5 text-xs"
              @click="
                handleNavigateWorkspace(
                  String(
                    resolvedResource === 'public.tenants'
                      ? props.row.id
                      : props.row.tenant_id,
                  ),
                )
              "
            >
              <Building2 class="size-3.5" />
              <span>{{ $t('term.workspace') }}</span>
              <ArrowUpRight class="size-3 text-muted-foreground" />
            </Button>

            <!-- Contextual Quick-Navigation for Campaign Run Logs -->
            <Button
              v-if="
                resolvedResource === 'automa.campaign_runs' &&
                props.row.id &&
                !$slots['row-actions']
              "
              variant="outline"
              size="sm"
              class="h-8 gap-1.5 px-2.5 text-xs"
              @click="handleNavigateCampaignRun(String(props.row.id))"
            >
              <span>{{ $t('common.viewLogs') }}</span>
              <ArrowUpRight class="size-3 text-muted-foreground" />
            </Button>

            <Button
              v-for="(act, idx) in props.options?.actions || []"
              :key="idx"
              :variant="act.variant || 'outline'"
              :disabled="act.disabled?.(props.row)"
              size="sm"
              class="h-8 gap-1.5 px-2.5 text-xs"
              @click="(act.handler ?? act.onClick)?.(props.row)"
            >
              <component :is="act.icon" v-if="act.icon" class="size-3.5" />
              <span>{{ act.label }}</span>
            </Button>
          </div>

          <div class="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              class="h-8 px-3 text-xs"
              @click="emit('update:open', false)"
            >
              {{ $t('common.close') }}
            </Button>
            <Button
              v-if="canEditRow"
              size="sm"
              class="h-8 gap-1.5 px-3.5 text-xs font-medium"
              data-testid="vxe-detail-sheet-edit"
              @click="startEditing"
            >
              <Edit3 class="size-3.5" />
              <span>{{ $t('common.edit') }}</span>
            </Button>
          </div>
        </div>

        <div v-else class="flex w-full items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            class="h-8 px-3 text-xs"
            :disabled="saving"
            @click="cancelEditing"
          >
            {{ $t('common.cancel') }}
          </Button>
          <Button
            size="sm"
            class="h-8 gap-1.5 px-4 text-xs font-medium"
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
