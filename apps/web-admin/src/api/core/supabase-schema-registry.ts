import type { SupabaseSchema } from '@vben/constants';

import type { EffectiveAccess } from './access';

import type { EnumItemMeta, ResolvedStatusMeta } from '#/constants';

import { SUPABASE_SCHEMA } from '@vben/constants';

import {
  BROWSER_STATUS_META,
  buildEnumFilterOptions,
  CAMPAIGN_STATUS_META,
  COMMERCE_ORDER_STATUS_META,
  COMMERCE_PRODUCT_TYPE_META,
  DEVICE_STATUS_META,
  getStatusToneMeta,
  PAYMENT_CHANNEL_META,
  PAYMENT_INTENT_STATUS_META,
  PROXY_STATUS_META,
  STATUS_TONE,
  SUBSCRIPTION_STATUS_META,
  SYSTEM_PLUGIN_STATUS_META,
  TENANT_PLAN_META,
  TENANT_STATUS_META,
  WALLET_TX_TYPE_META,
  WORKFLOW_STATUS_META,
} from '#/constants';

import { supabaseRequest } from './supabase-client';

export type SupabaseResourceKey =
  | 'automa.campaign_runs'
  | 'automa.workflows'
  | 'billing.payment_gateways'
  | 'billing.payment_intents'
  | 'billing.plans'
  | 'billing.subscriptions'
  | 'billing.wallet_transactions'
  | 'commerce.orders'
  | 'commerce.products'
  | 'public.audit_logs'
  | 'public.permissions'
  | 'public.profiles'
  | 'public.roles'
  | 'public.system_plugins'
  | 'public.tenants'
  | 'runners.browsers'
  | 'runners.devices'
  | 'runners.proxies';

export type DynamicFieldType =
  | 'boolean'
  | 'datetime'
  | 'enum'
  | 'json'
  | 'number'
  | 'text'
  | 'textarea'
  | 'uuid';

export interface SupabaseColumnSchema {
  editable?: boolean;
  enumMeta?: Record<string, EnumItemMeta>;
  field: string;
  /** Optional row-level guard that disables editing this specific column */
  isFieldLocked?: (row: Record<string, any>) => boolean;
  labelKey?: string;
  max?: number;
  min?: number;
  options?: Array<{ label: string; value: number | string }>;
  required?: boolean;
  type: DynamicFieldType;
}

export interface RlsDecision {
  allowed: boolean;
  policyName: string;
  reasonKey?: string;
}

export interface RowRlsEvaluation {
  canDelete: RlsDecision;
  canSelect: RlsDecision;
  canUpdate: RlsDecision;
  resource: SupabaseResourceKey;
  schema: SupabaseSchema;
  table: string;
}

export interface SupabaseTableSchema {
  columns: Record<string, SupabaseColumnSchema>;
  evaluateRls: (
    row: Record<string, any>,
    access?: EffectiveAccess | null,
  ) => {
    canDelete: RlsDecision;
    canSelect: RlsDecision;
    canUpdate: RlsDecision;
  };
  primaryKey: string;
  resource: SupabaseResourceKey;
  schema: SupabaseSchema;
  table: string;
  titleField?: string;
}

export interface DynamicVxeFormField {
  editable: boolean;
  field: string;
  group: 'editable' | 'json' | 'readonly';
  max?: number;
  min?: number;
  options?: Array<{ label: string; value: number | string }>;
  required?: boolean;
  statusMeta?: ResolvedStatusMeta;
  title: string;
  type: DynamicFieldType;
}

const PROXY_PROTOCOL_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'HTTP', value: 'http' },
  { label: 'HTTPS', value: 'https' },
  { label: 'SOCKS4', value: 'socks4' },
  { label: 'SOCKS5', value: 'socks5' },
];

const PRODUCT_VISIBILITY_META: Record<string, EnumItemMeta> = {
  both: {
    fallbackLabel: 'Public & internal',
    labelKey: 'common.visBoth',
    tone: STATUS_TONE.SUCCESS,
  },
  hidden: {
    fallbackLabel: 'Hidden',
    labelKey: 'page.commerce_view.vis_hidden',
    tone: STATUS_TONE.NEUTRAL,
  },
  public: {
    fallbackLabel: 'Public store',
    labelKey: 'page.commerce_view.vis_public',
    tone: STATUS_TONE.PRIMARY,
  },
  tenant: {
    fallbackLabel: 'Internal workspace',
    labelKey: 'common.visTenant',
    tone: STATUS_TONE.INFO,
  },
};

const USER_PRIMARY_ROLE_META: Record<string, EnumItemMeta> = {
  admin: {
    fallbackLabel: 'Admin',
    labelKey: 'page.system_view.role_admin',
    tone: STATUS_TONE.PRIMARY,
  },
  member: {
    fallbackLabel: 'Member',
    labelKey: 'page.system_view.role_member',
    tone: STATUS_TONE.INFO,
  },
  owner: {
    fallbackLabel: 'Owner',
    labelKey: 'page.system_view.role_owner',
    tone: STATUS_TONE.SUCCESS,
  },
  viewer: {
    fallbackLabel: 'Viewer',
    labelKey: 'page.system_view.role_viewer',
    tone: STATUS_TONE.NEUTRAL,
  },
};

function matchesPermissionList(
  list: string[] | undefined,
  permission: string,
): boolean {
  if (!Array.isArray(list) || list.length === 0) {
    return false;
  }
  const colonForm = permission.replaceAll('.', ':');
  const dotForm = permission.replaceAll(':', '.');
  return (
    list.includes('*') ||
    list.includes(permission) ||
    list.includes(colonForm) ||
    list.includes(dotForm)
  );
}

function hasTenantOrGlobalPermission(
  access: EffectiveAccess | null | undefined,
  permission: string,
  tenantId?: null | string,
): boolean {
  if (!access) {
    // When EffectiveAccess hasn't loaded yet, allow optimistic UI interaction
    // while backend PostgREST RLS enforces the authoritative check.
    return true;
  }
  if (access.isSuperadmin) {
    return true;
  }
  if (
    tenantId &&
    matchesPermissionList(access.tenantPermissions?.[tenantId], permission)
  ) {
    return true;
  }
  return matchesPermissionList(access.permissions, permission);
}

export const SUPABASE_TABLE_REGISTRY: Record<
  SupabaseResourceKey,
  SupabaseTableSchema
> = {
  'public.tenants': {
    resource: 'public.tenants',
    schema: SUPABASE_SCHEMA.PUBLIC,
    table: 'tenants',
    primaryKey: 'id',
    titleField: 'name',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'uuid' },
      name: {
        editable: true,
        field: 'name',
        labelKey: 'common.name',
        required: true,
        type: 'text',
      },
      slug: {
        editable: true,
        field: 'slug',
        labelKey: 'page.workspace.col_slug',
        required: true,
        type: 'text',
      },
      plan: {
        editable: true,
        enumMeta: TENANT_PLAN_META,
        field: 'plan',
        labelKey: 'term.plan',
        type: 'enum',
      },
      status: {
        editable: true,
        enumMeta: TENANT_STATUS_META,
        field: 'status',
        labelKey: 'common.status',
        type: 'enum',
      },
      my_role: {
        enumMeta: USER_PRIMARY_ROLE_META,
        field: 'my_role',
        labelKey: 'term.role',
        type: 'enum',
      },
      member_count: {
        field: 'member_count',
        labelKey: 'term.members',
        type: 'number',
      },
      created_at: {
        field: 'created_at',
        labelKey: 'common.createdAt',
        type: 'datetime',
      },
    },
    evaluateRls: (row, access) => {
      const isOwnerOrAdmin =
        row?.my_role === 'owner' || row?.my_role === 'admin';
      const canUpdate =
        !access ||
        access.isSuperadmin ||
        isOwnerOrAdmin ||
        hasTenantOrGlobalPermission(access, 'tenants.update', row?.id);
      const canDelete =
        !access || access.isSuperadmin || row?.my_role === 'owner';
      return {
        canSelect: { allowed: true, policyName: 'tenants_select_member' },
        canUpdate: {
          allowed: canUpdate,
          policyName: 'tenants_update_owner_or_admin',
          reasonKey: canUpdate ? undefined : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed: canDelete,
          policyName: 'tenants_delete_owner_only',
          reasonKey: canDelete ? undefined : 'common.rlsReadOnlyReason',
        },
      };
    },
  },

  'automa.workflows': {
    resource: 'automa.workflows',
    schema: SUPABASE_SCHEMA.AUTOMA,
    table: 'workflows',
    primaryKey: 'id',
    titleField: 'name',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'uuid' },
      name: {
        editable: true,
        field: 'name',
        labelKey: 'common.name',
        required: true,
        type: 'text',
      },
      description: {
        editable: true,
        field: 'description',
        labelKey: 'common.description',
        type: 'textarea',
      },
      version: {
        editable: true,
        field: 'version',
        labelKey: 'common.version',
        type: 'text',
      },
      status: {
        editable: true,
        enumMeta: WORKFLOW_STATUS_META,
        field: 'status',
        labelKey: 'common.status',
        type: 'enum',
      },
      triggerSummary: {
        field: 'triggerSummary',
        labelKey: 'common.trigger',
        type: 'text',
      },
      nodeCount: {
        field: 'nodeCount',
        labelKey: 'common.nodes',
        type: 'number',
      },
      tenant_id: { field: 'tenant_id', labelKey: 'term.tenant', type: 'uuid' },
      created_at: {
        field: 'created_at',
        labelKey: 'common.createdAt',
        type: 'datetime',
      },
      updated_at: {
        field: 'updated_at',
        labelKey: 'common.updatedAt',
        type: 'datetime',
      },
    },
    evaluateRls: (row, access) => {
      const allowed = hasTenantOrGlobalPermission(
        access,
        'automa.workflows.manage',
        row?.tenant_id,
      );
      return {
        canSelect: { allowed: true, policyName: 'workflows_select' },
        canUpdate: {
          allowed,
          policyName: 'workflows_manage',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed,
          policyName: 'workflows_manage',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
      };
    },
  },

  'automa.campaign_runs': {
    resource: 'automa.campaign_runs',
    schema: SUPABASE_SCHEMA.AUTOMA,
    table: 'campaign_runs',
    primaryKey: 'id',
    titleField: 'name',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'uuid' },
      name: {
        editable: true,
        field: 'name',
        labelKey: 'common.name',
        required: true,
        type: 'text',
      },
      status: {
        editable: true,
        enumMeta: CAMPAIGN_STATUS_META,
        field: 'status',
        labelKey: 'common.status',
        type: 'enum',
      },
      workflow_id: {
        field: 'workflow_id',
        labelKey: 'term.workflow',
        type: 'uuid',
      },
      device_id: { field: 'device_id', labelKey: 'term.device', type: 'uuid' },
      total_tasks: {
        field: 'total_tasks',
        labelKey: 'page.runs_view.col_progress',
        type: 'number',
      },
      completed_tasks: {
        field: 'completed_tasks',
        labelKey: 'common.completed',
        type: 'number',
      },
      failed_tasks: {
        field: 'failed_tasks',
        labelKey: 'common.failed',
        type: 'number',
      },
      started_at: {
        field: 'started_at',
        labelKey: 'common.createdAt',
        type: 'datetime',
      },
      completed_at: {
        field: 'completed_at',
        labelKey: 'common.updatedAt',
        type: 'datetime',
      },
    },
    evaluateRls: (row, access) => {
      const allowed = hasTenantOrGlobalPermission(
        access,
        'automa.campaigns.run',
        row?.tenant_id,
      );
      return {
        canSelect: { allowed: true, policyName: 'campaigns_select' },
        canUpdate: {
          allowed,
          policyName: 'campaigns_run',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed,
          policyName: 'campaigns_run',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
      };
    },
  },

  'runners.devices': {
    resource: 'runners.devices',
    schema: SUPABASE_SCHEMA.RUNNERS,
    table: 'devices',
    primaryKey: 'id',
    titleField: 'name',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'uuid' },
      name: {
        editable: true,
        field: 'name',
        labelKey: 'common.name',
        required: true,
        type: 'text',
      },
      status: {
        editable: true,
        enumMeta: DEVICE_STATUS_META,
        field: 'status',
        labelKey: 'common.status',
        type: 'enum',
      },
      os_info: {
        editable: true,
        field: 'os_info',
        labelKey: 'page.automation_view.col_os',
        type: 'text',
      },
      ip_address: {
        editable: true,
        field: 'ip_address',
        labelKey: 'common.ipAddress',
        type: 'text',
      },
      machine_id: {
        field: 'machine_id',
        labelKey: 'common.id',
        type: 'text',
      },
      runner_version: {
        field: 'runner_version',
        labelKey: 'common.version',
        type: 'text',
      },
      last_seen_at: {
        field: 'last_seen_at',
        labelKey: 'common.updatedAt',
        type: 'datetime',
      },
    },
    evaluateRls: (row, access) => {
      const allowed = hasTenantOrGlobalPermission(
        access,
        'runners.manage',
        row?.tenant_id,
      );
      return {
        canSelect: { allowed: true, policyName: 'devices_select' },
        canUpdate: {
          allowed,
          policyName: 'devices_manage',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed,
          policyName: 'devices_manage',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
      };
    },
  },

  'runners.browsers': {
    resource: 'runners.browsers',
    schema: SUPABASE_SCHEMA.RUNNERS,
    table: 'browsers',
    primaryKey: 'id',
    titleField: 'name',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'uuid' },
      name: {
        editable: true,
        field: 'name',
        labelKey: 'common.name',
        required: true,
        type: 'text',
      },
      status: {
        editable: true,
        enumMeta: BROWSER_STATUS_META,
        field: 'status',
        labelKey: 'common.status',
        type: 'enum',
      },
      os_platform: {
        editable: true,
        field: 'os_platform',
        labelKey: 'page.automation_view.col_os',
        type: 'text',
      },
      browser_version: {
        editable: true,
        field: 'browser_version',
        labelKey: 'common.version',
        type: 'text',
      },
      proxy_id: {
        editable: true,
        field: 'proxy_id',
        labelKey: 'term.proxy',
        type: 'text',
      },
      created_at: {
        field: 'created_at',
        labelKey: 'common.createdAt',
        type: 'datetime',
      },
    },
    evaluateRls: (row, access) => {
      const allowed = hasTenantOrGlobalPermission(
        access,
        'runners.manage',
        row?.tenant_id,
      );
      return {
        canSelect: { allowed: true, policyName: 'browsers_select' },
        canUpdate: {
          allowed,
          policyName: 'browsers_manage',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed,
          policyName: 'browsers_manage',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
      };
    },
  },

  'runners.proxies': {
    resource: 'runners.proxies',
    schema: SUPABASE_SCHEMA.RUNNERS,
    table: 'proxies',
    primaryKey: 'id',
    titleField: 'host',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'uuid' },
      host: {
        editable: true,
        field: 'host',
        labelKey: 'common.endpoint',
        required: true,
        type: 'text',
      },
      port: {
        editable: true,
        field: 'port',
        labelKey: 'common.port',
        max: 65_535,
        min: 1,
        required: true,
        type: 'number',
      },
      protocol: {
        editable: true,
        field: 'protocol',
        labelKey: 'common.type',
        options: PROXY_PROTOCOL_OPTIONS,
        type: 'enum',
      },
      status: {
        editable: true,
        enumMeta: PROXY_STATUS_META,
        field: 'status',
        labelKey: 'common.status',
        type: 'enum',
      },
      country_code: {
        editable: true,
        field: 'country_code',
        labelKey: 'common.country',
        type: 'text',
      },
      is_residential: {
        editable: true,
        field: 'is_residential',
        labelKey: 'common.residential',
        type: 'boolean',
      },
      latency_ms: {
        field: 'latency_ms',
        labelKey: 'common.latency',
        type: 'number',
      },
      last_checked_at: {
        field: 'last_checked_at',
        labelKey: 'common.updatedAt',
        type: 'datetime',
      },
    },
    evaluateRls: (row, access) => {
      const allowed = hasTenantOrGlobalPermission(
        access,
        'runners.manage',
        row?.tenant_id,
      );
      return {
        canSelect: { allowed: true, policyName: 'proxies_select' },
        canUpdate: {
          allowed,
          policyName: 'proxies_manage',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed,
          policyName: 'proxies_manage',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
      };
    },
  },

  'commerce.orders': {
    resource: 'commerce.orders',
    schema: SUPABASE_SCHEMA.COMMERCE,
    table: 'orders',
    primaryKey: 'id',
    titleField: 'order_code',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'uuid' },
      order_code: {
        field: 'order_code',
        labelKey: 'page.commerce_view.col_order_code',
        type: 'text',
      },
      buyer_email: {
        editable: true,
        field: 'buyer_email',
        labelKey: 'common.email',
        type: 'text',
      },
      status: {
        editable: true,
        enumMeta: COMMERCE_ORDER_STATUS_META,
        field: 'status',
        labelKey: 'common.status',
        type: 'enum',
      },
      payment_method: {
        enumMeta: PAYMENT_CHANNEL_META,
        field: 'payment_method',
        labelKey: 'page.commerce_view.col_payment_method',
        type: 'enum',
      },
      quantity: {
        field: 'quantity',
        labelKey: 'common.quantity',
        type: 'number',
      },
      total_credits: {
        field: 'total_credits',
        labelKey: 'common.amount',
        type: 'number',
      },
      created_at: {
        field: 'created_at',
        labelKey: 'common.createdAt',
        type: 'datetime',
      },
      fulfilled_at: {
        field: 'fulfilled_at',
        labelKey: 'common.updatedAt',
        type: 'datetime',
      },
    },
    evaluateRls: (row, access) => {
      const isSuperadmin = !access || access.isSuperadmin;
      const canUpdateBuyerPending =
        isSuperadmin || row?.status === 'pending_payment';
      return {
        canSelect: { allowed: true, policyName: 'orders_select_tenant' },
        canUpdate: {
          allowed: canUpdateBuyerPending,
          policyName: isSuperadmin
            ? 'orders_platform_admin'
            : 'orders_select_tenant',
          reasonKey: canUpdateBuyerPending
            ? undefined
            : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed: isSuperadmin,
          policyName: 'orders_platform_admin',
          reasonKey: isSuperadmin ? undefined : 'common.rlsReadOnlyReason',
        },
      };
    },
  },

  'commerce.products': {
    resource: 'commerce.products',
    schema: SUPABASE_SCHEMA.COMMERCE,
    table: 'products',
    primaryKey: 'id',
    titleField: 'name',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'uuid' },
      name: {
        editable: true,
        field: 'name',
        labelKey: 'common.name',
        required: true,
        type: 'text',
      },
      slug: {
        editable: true,
        field: 'slug',
        labelKey: 'page.workspace.col_slug',
        required: true,
        type: 'text',
      },
      product_type: {
        editable: true,
        enumMeta: COMMERCE_PRODUCT_TYPE_META,
        field: 'product_type',
        labelKey: 'common.type',
        type: 'enum',
      },
      visibility: {
        editable: true,
        enumMeta: PRODUCT_VISIBILITY_META,
        field: 'visibility',
        labelKey: 'common.visibility',
        type: 'enum',
      },
      is_active: {
        editable: true,
        field: 'is_active',
        labelKey: 'common.status',
        type: 'boolean',
      },
      short_description: {
        editable: true,
        field: 'short_description',
        labelKey: 'common.description',
        type: 'textarea',
      },
      sort_order: {
        editable: true,
        field: 'sort_order',
        labelKey: 'common.sortOrder',
        type: 'number',
      },
      stock_available: {
        field: 'stock_available',
        labelKey: 'term.stock',
        type: 'number',
      },
      sold_count: {
        field: 'sold_count',
        labelKey: 'common.sold',
        type: 'number',
      },
      created_at: {
        field: 'created_at',
        labelKey: 'common.createdAt',
        type: 'datetime',
      },
    },
    evaluateRls: (_row, access) => {
      const allowed = !access || access.isSuperadmin;
      return {
        canSelect: { allowed: true, policyName: 'products_select_public' },
        canUpdate: {
          allowed,
          policyName: 'products_platform_admin',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed,
          policyName: 'products_platform_admin',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
      };
    },
  },

  'billing.wallet_transactions': {
    resource: 'billing.wallet_transactions',
    schema: SUPABASE_SCHEMA.BILLING,
    table: 'wallet_transactions',
    primaryKey: 'id',
    titleField: 'reference_id',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'uuid' },
      tx_type: {
        enumMeta: WALLET_TX_TYPE_META,
        field: 'tx_type',
        labelKey: 'common.type',
        type: 'enum',
      },
      amount_credits: {
        field: 'amount_credits',
        labelKey: 'common.amount',
        type: 'number',
      },
      balance_after: {
        field: 'balance_after',
        labelKey: 'page.commerce_view.col_balance_after',
        type: 'number',
      },
      description: {
        field: 'description',
        labelKey: 'common.description',
        type: 'textarea',
      },
      reference_type: {
        field: 'reference_type',
        labelKey: 'common.type',
        type: 'text',
      },
      reference_id: {
        field: 'reference_id',
        labelKey: 'common.reference',
        type: 'text',
      },
      created_at: {
        field: 'created_at',
        labelKey: 'common.createdAt',
        type: 'datetime',
      },
    },
    evaluateRls: () => ({
      canSelect: { allowed: true, policyName: 'wallet_tx_select_tenant' },
      canUpdate: {
        allowed: false,
        policyName: 'rls_append_only_ledger',
        reasonKey: 'common.rlsAppendOnlyLedger',
      },
      canDelete: {
        allowed: false,
        policyName: 'rls_append_only_ledger',
        reasonKey: 'common.rlsAppendOnlyLedger',
      },
    }),
  },

  'billing.payment_intents': {
    resource: 'billing.payment_intents',
    schema: SUPABASE_SCHEMA.BILLING,
    table: 'payment_intents',
    primaryKey: 'id',
    titleField: 'reference_code',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'uuid' },
      reference_code: {
        field: 'reference_code',
        labelKey: 'common.reference',
        type: 'text',
      },
      provider_code: {
        enumMeta: PAYMENT_CHANNEL_META,
        field: 'provider_code',
        labelKey: 'page.commerce_view.col_payment_method',
        type: 'enum',
      },
      status: {
        editable: true,
        enumMeta: PAYMENT_INTENT_STATUS_META,
        field: 'status',
        labelKey: 'common.status',
        type: 'enum',
      },
      credits_amount: {
        editable: true,
        field: 'credits_amount',
        labelKey: 'common.amount',
        min: 0,
        type: 'number',
      },
      amount_original: {
        field: 'amount_original',
        labelKey: 'common.price',
        type: 'number',
      },
      currency_original: {
        field: 'currency_original',
        labelKey: 'common.currency',
        type: 'text',
      },
      created_at: {
        field: 'created_at',
        labelKey: 'common.createdAt',
        type: 'datetime',
      },
    },
    evaluateRls: (_row, access) => {
      const allowed = !access || access.isSuperadmin;
      return {
        canSelect: { allowed: true, policyName: 'payment_intents_select' },
        canUpdate: {
          allowed,
          policyName: 'payment_intents_platform_admin',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed: false,
          policyName: 'rls_append_only_ledger',
          reasonKey: 'common.rlsAppendOnlyLedger',
        },
      };
    },
  },

  'billing.payment_gateways': {
    resource: 'billing.payment_gateways',
    schema: SUPABASE_SCHEMA.BILLING,
    table: 'payment_gateways',
    primaryKey: 'id',
    titleField: 'display_name',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'uuid' },
      provider_code: {
        enumMeta: PAYMENT_CHANNEL_META,
        field: 'provider_code',
        labelKey: 'common.type',
        type: 'enum',
      },
      display_name: {
        editable: true,
        field: 'display_name',
        labelKey: 'common.name',
        required: true,
        type: 'text',
      },
      rate_per_credit: {
        editable: true,
        field: 'rate_per_credit',
        labelKey: 'common.price',
        min: 0,
        type: 'number',
      },
      is_active: {
        editable: true,
        field: 'is_active',
        labelKey: 'common.status',
        type: 'boolean',
      },
      sort_order: {
        editable: true,
        field: 'sort_order',
        labelKey: 'common.sortOrder',
        type: 'number',
      },
      public_config: {
        editable: true,
        field: 'public_config',
        labelKey: 'common.publicConfig',
        type: 'json',
      },
      updated_at: {
        field: 'updated_at',
        labelKey: 'common.updatedAt',
        type: 'datetime',
      },
    },
    evaluateRls: (_row, access) => {
      const allowed = !access || access.isSuperadmin;
      return {
        canSelect: { allowed: true, policyName: 'payment_gateways_select' },
        canUpdate: {
          allowed,
          policyName: 'payment_gateways_platform_admin',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed: false,
          policyName: 'payment_gateways_platform_admin',
          reasonKey: 'common.rlsReadOnlyReason',
        },
      };
    },
  },

  'public.system_plugins': {
    resource: 'public.system_plugins',
    schema: SUPABASE_SCHEMA.PUBLIC,
    table: 'system_plugins',
    primaryKey: 'id',
    titleField: 'name',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'text' },
      name: {
        editable: true,
        field: 'name',
        labelKey: 'common.name',
        required: true,
        type: 'text',
      },
      description: {
        editable: true,
        field: 'description',
        labelKey: 'common.description',
        type: 'textarea',
      },
      version: {
        editable: true,
        field: 'version',
        labelKey: 'common.version',
        type: 'text',
      },
      schema_name: {
        field: 'schema_name',
        labelKey: 'common.module',
        type: 'text',
      },
      status: {
        editable: true,
        enumMeta: SYSTEM_PLUGIN_STATUS_META,
        field: 'status',
        isFieldLocked: (row) => Boolean(row?.is_core || row?.is_system),
        labelKey: 'common.status',
        type: 'enum',
      },
      is_core: {
        field: 'is_core',
        labelKey: 'common.coreKernel',
        type: 'boolean',
      },
      installed_at: {
        field: 'installed_at',
        labelKey: 'page.system_view.plugins_col_installed_at',
        type: 'datetime',
      },
      metadata: {
        editable: true,
        field: 'metadata',
        labelKey: 'common.publicConfig',
        type: 'json',
      },
    },
    evaluateRls: (_row, access) => {
      const allowed = !access || access.isSuperadmin;
      return {
        canSelect: { allowed: true, policyName: 'system_plugins_select_all' },
        canUpdate: {
          allowed,
          policyName: 'system_plugins_manage_admin',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed: false,
          policyName: 'system_plugins_manage_admin',
          reasonKey: 'common.rlsReadOnlyReason',
        },
      };
    },
  },

  'billing.plans': {
    resource: 'billing.plans',
    schema: SUPABASE_SCHEMA.BILLING,
    table: 'plans',
    primaryKey: 'id',
    titleField: 'name',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'text' },
      name: {
        editable: true,
        field: 'name',
        labelKey: 'common.name',
        required: true,
        type: 'text',
      },
      description: {
        editable: true,
        field: 'description',
        labelKey: 'common.description',
        type: 'textarea',
      },
      price_monthly_usd: {
        editable: true,
        field: 'price_monthly_usd',
        labelKey: 'common.price',
        min: 0,
        type: 'number',
      },
      max_members: {
        editable: true,
        field: 'max_members',
        labelKey: 'term.members',
        min: 1,
        type: 'number',
      },
      max_storage_mb: {
        editable: true,
        field: 'max_storage_mb',
        labelKey: 'common.storageMb',
        min: 0,
        type: 'number',
      },
      max_monthly_runs: {
        editable: true,
        field: 'max_monthly_runs',
        labelKey: 'common.monthlyRuns',
        min: 0,
        type: 'number',
      },
      is_active: {
        editable: true,
        field: 'is_active',
        labelKey: 'common.status',
        type: 'boolean',
      },
      metadata: {
        editable: true,
        field: 'metadata',
        labelKey: 'common.publicConfig',
        type: 'json',
      },
      created_at: {
        field: 'created_at',
        labelKey: 'common.createdAt',
        type: 'datetime',
      },
    },
    evaluateRls: (_row, access) => {
      const allowed = !access || access.isSuperadmin;
      return {
        canSelect: { allowed: true, policyName: 'plans_select_all' },
        canUpdate: {
          allowed,
          policyName: 'plans_platform_admin',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed: false,
          policyName: 'plans_platform_admin',
          reasonKey: 'common.rlsReadOnlyReason',
        },
      };
    },
  },

  'public.profiles': {
    resource: 'public.profiles',
    schema: SUPABASE_SCHEMA.PUBLIC,
    table: 'profiles',
    primaryKey: 'id',
    titleField: 'full_name',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'uuid' },
      full_name: {
        editable: true,
        field: 'full_name',
        labelKey: 'common.name',
        required: true,
        type: 'text',
      },
      email: {
        field: 'email',
        labelKey: 'common.email',
        type: 'text',
      },
      avatar_url: {
        editable: true,
        field: 'avatar_url',
        labelKey: 'common.avatarUrl',
        type: 'text',
      },
      primary_role: {
        enumMeta: USER_PRIMARY_ROLE_META,
        field: 'primary_role',
        labelKey: 'term.role',
        type: 'enum',
      },
      tenant_count: {
        field: 'tenant_count',
        labelKey: 'term.tenants',
        type: 'number',
      },
      created_at: {
        field: 'created_at',
        labelKey: 'common.createdAt',
        type: 'datetime',
      },
      updated_at: {
        field: 'updated_at',
        labelKey: 'common.updatedAt',
        type: 'datetime',
      },
    },
    evaluateRls: (_row, access) => {
      const allowed = !access || access.isSuperadmin;
      return {
        canSelect: { allowed: true, policyName: 'profiles_select_auth' },
        canUpdate: {
          allowed,
          policyName: 'profiles_self_or_superadmin',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed: false,
          policyName: 'profiles_self_or_superadmin',
          reasonKey: 'common.rlsReadOnlyReason',
        },
      };
    },
  },

  'public.roles': {
    resource: 'public.roles',
    schema: SUPABASE_SCHEMA.PUBLIC,
    table: 'roles',
    primaryKey: 'id',
    titleField: 'name',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'uuid' },
      name: {
        editable: true,
        field: 'name',
        isFieldLocked: (row) => Boolean(row?.is_system),
        labelKey: 'common.name',
        required: true,
        type: 'text',
      },
      description: {
        editable: true,
        field: 'description',
        isFieldLocked: (row) => Boolean(row?.is_system),
        labelKey: 'common.description',
        type: 'textarea',
      },
      is_system: {
        field: 'is_system',
        labelKey: 'common.systemRole',
        type: 'boolean',
      },
      tenant_name: {
        field: 'tenant_name',
        labelKey: 'term.tenant',
        type: 'text',
      },
      permission_count: {
        field: 'permission_count',
        labelKey: 'term.permissions',
        type: 'number',
      },
      created_at: {
        field: 'created_at',
        labelKey: 'common.createdAt',
        type: 'datetime',
      },
    },
    evaluateRls: (row, access) => {
      if (row?.is_system) {
        return {
          canSelect: { allowed: true, policyName: 'roles_select_all' },
          canUpdate: {
            allowed: false,
            policyName: 'roles_system_immutable',
            reasonKey: 'common.rlsSystemRoleImmutable',
          },
          canDelete: {
            allowed: false,
            policyName: 'roles_system_immutable',
            reasonKey: 'common.rlsSystemRoleImmutable',
          },
        };
      }
      const allowed = hasTenantOrGlobalPermission(
        access,
        'roles.manage',
        row?.tenant_id,
      );
      return {
        canSelect: { allowed: true, policyName: 'roles_select_all' },
        canUpdate: {
          allowed,
          policyName: 'roles_manage_custom',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed,
          policyName: 'roles_manage_custom',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
      };
    },
  },

  'public.permissions': {
    resource: 'public.permissions',
    schema: SUPABASE_SCHEMA.PUBLIC,
    table: 'permissions',
    primaryKey: 'id',
    titleField: 'id',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'text' },
      module: {
        editable: true,
        field: 'module',
        labelKey: 'common.module',
        type: 'text',
      },
      description: {
        editable: true,
        field: 'description',
        labelKey: 'common.description',
        type: 'textarea',
      },
      created_at: {
        field: 'created_at',
        labelKey: 'common.createdAt',
        type: 'datetime',
      },
    },
    evaluateRls: (_row, access) => {
      const allowed = !access || access.isSuperadmin;
      return {
        canSelect: { allowed: true, policyName: 'permissions_select_all' },
        canUpdate: {
          allowed,
          policyName: 'permissions_catalog_admin',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed: false,
          policyName: 'permissions_catalog_admin',
          reasonKey: 'common.rlsReadOnlyReason',
        },
      };
    },
  },

  'billing.subscriptions': {
    resource: 'billing.subscriptions',
    schema: SUPABASE_SCHEMA.BILLING,
    table: 'subscriptions',
    primaryKey: 'id',
    titleField: 'tenant_name',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'uuid' },
      tenant_id: { field: 'tenant_id', labelKey: 'term.tenant', type: 'uuid' },
      tenant_name: {
        field: 'tenant_name',
        labelKey: 'term.workspace',
        type: 'text',
      },
      tenant_slug: {
        field: 'tenant_slug',
        labelKey: 'page.workspace.col_slug',
        type: 'text',
      },
      plan_id: {
        editable: true,
        enumMeta: TENANT_PLAN_META,
        field: 'plan_id',
        labelKey: 'term.plan',
        type: 'enum',
      },
      plan_name: {
        field: 'plan_name',
        labelKey: 'term.plan',
        type: 'text',
      },
      price_monthly_usd: {
        field: 'price_monthly_usd',
        labelKey: 'page.system_view.subs_col_unit_price',
        type: 'number',
      },
      status: {
        editable: true,
        enumMeta: SUBSCRIPTION_STATUS_META,
        field: 'status',
        labelKey: 'common.status',
        type: 'enum',
      },
      cancel_at_period_end: {
        editable: true,
        field: 'cancel_at_period_end',
        labelKey: 'common.cancelAtPeriodEnd',
        type: 'boolean',
      },
      current_period_start: {
        field: 'current_period_start',
        labelKey: 'common.createdAt',
        type: 'datetime',
      },
      current_period_end: {
        field: 'current_period_end',
        labelKey: 'page.system_view.subs_col_next_billing',
        type: 'datetime',
      },
      created_at: {
        field: 'created_at',
        labelKey: 'common.createdAt',
        type: 'datetime',
      },
    },
    evaluateRls: (_row, access) => {
      const allowed = !access || access.isSuperadmin;
      return {
        canSelect: { allowed: true, policyName: 'subscriptions_select_tenant' },
        canUpdate: {
          allowed,
          policyName: 'subscriptions_platform_admin',
          reasonKey: allowed ? undefined : 'common.rlsReadOnlyReason',
        },
        canDelete: {
          allowed: false,
          policyName: 'subscriptions_platform_admin',
          reasonKey: 'common.rlsReadOnlyReason',
        },
      };
    },
  },

  'public.audit_logs': {
    resource: 'public.audit_logs',
    schema: SUPABASE_SCHEMA.PUBLIC,
    table: 'audit_logs',
    primaryKey: 'id',
    titleField: 'action',
    columns: {
      id: { field: 'id', labelKey: 'common.id', type: 'uuid' },
      action: { field: 'action', labelKey: 'common.action', type: 'text' },
      entity_type: {
        field: 'entity_type',
        labelKey: 'common.type',
        type: 'text',
      },
      entity_id: {
        field: 'entity_id',
        labelKey: 'common.entityId',
        type: 'text',
      },
      tenant_id: { field: 'tenant_id', labelKey: 'term.tenant', type: 'uuid' },
      tenant_name: {
        field: 'tenant_name',
        labelKey: 'term.tenant',
        type: 'text',
      },
      actor_id: { field: 'actor_id', labelKey: 'common.actor', type: 'uuid' },
      actor_name: {
        field: 'actor_name',
        labelKey: 'common.actor',
        type: 'text',
      },
      ip_address: {
        field: 'ip_address',
        labelKey: 'common.ipAddress',
        type: 'text',
      },
      user_agent: {
        field: 'user_agent',
        labelKey: 'common.userAgent',
        type: 'textarea',
      },
      old_values: {
        field: 'old_values',
        labelKey: 'common.oldValues',
        type: 'json',
      },
      new_values: {
        field: 'new_values',
        labelKey: 'common.newValues',
        type: 'json',
      },
      created_at: {
        field: 'created_at',
        labelKey: 'common.createdAt',
        type: 'datetime',
      },
    },
    evaluateRls: () => ({
      canSelect: { allowed: true, policyName: 'audit_logs_select_authorized' },
      canUpdate: {
        allowed: false,
        policyName: 'rls_append_only_ledger',
        reasonKey: 'common.rlsAppendOnlyLedger',
      },
      canDelete: {
        allowed: false,
        policyName: 'rls_append_only_ledger',
        reasonKey: 'common.rlsAppendOnlyLedger',
      },
    }),
  },
};

const ROUTE_RESOURCE_MAP: Array<{
  pattern: RegExp;
  resource: SupabaseResourceKey;
}> = [
  { pattern: /^\/tenants(\/|$)/, resource: 'public.tenants' },
  { pattern: /^\/automation\/workflows/, resource: 'automa.workflows' },
  { pattern: /^\/automation\/runs/, resource: 'automa.campaign_runs' },
  { pattern: /^\/automation\/devices/, resource: 'runners.devices' },
  { pattern: /^\/automation\/browsers/, resource: 'runners.browsers' },
  { pattern: /^\/automation\/proxies/, resource: 'runners.proxies' },
  { pattern: /^\/commerce\/orders/, resource: 'commerce.orders' },
  { pattern: /^\/commerce\/wallet/, resource: 'billing.wallet_transactions' },
  { pattern: /^\/system\/plugins/, resource: 'public.system_plugins' },
  { pattern: /^\/system\/plans/, resource: 'billing.plans' },
  { pattern: /^\/system\/users/, resource: 'public.profiles' },
  { pattern: /^\/system\/subscriptions/, resource: 'billing.subscriptions' },
  { pattern: /^\/system\/audit-logs/, resource: 'public.audit_logs' },
];

/**
 * Automatically resolves the canonical `SupabaseResourceKey` from an explicit
 * option, the active route path, or runtime row shape introspection.
 */
export function inferResourceFromRouteAndRow(
  routePath?: null | string,
  row?: null | Record<string, any>,
  explicitResource?: null | SupabaseResourceKey,
): SupabaseResourceKey {
  if (explicitResource && SUPABASE_TABLE_REGISTRY[explicitResource]) {
    return explicitResource;
  }

  // Row-shape disambiguation for multi-grid pages (/commerce/admin & /system/roles)
  if (row && typeof row === 'object') {
    if ('product_type' in row && 'visibility' in row) {
      return 'commerce.products';
    }
    if ('order_code' in row && 'total_credits' in row) {
      return 'commerce.orders';
    }
    if ('reference_code' in row && 'credits_amount' in row) {
      return 'billing.payment_intents';
    }
    if ('rate_per_credit' in row && 'provider_code' in row) {
      return 'billing.payment_gateways';
    }
    if ('tx_type' in row && 'balance_after' in row) {
      return 'billing.wallet_transactions';
    }
    if (
      'is_system' in row &&
      ('permission_count' in row || Array.isArray(row.permissions))
    ) {
      return 'public.roles';
    }
    if ('module' in row && !('is_system' in row) && !('tenant_count' in row)) {
      return 'public.permissions';
    }
    if ('price_monthly_usd' in row && 'max_members' in row) {
      return 'billing.plans';
    }
    if ('cancel_at_period_end' in row && 'plan_id' in row) {
      return 'billing.subscriptions';
    }
    if ('entity_type' in row && 'actor_id' in row) {
      return 'public.audit_logs';
    }
    if ('is_core' in row && 'version' in row) {
      return 'public.system_plugins';
    }
    if ('machine_id' in row || 'runner_version' in row) {
      return 'runners.devices';
    }
    if ('browser_version' in row || 'os_platform' in row) {
      return 'runners.browsers';
    }
    if ('host' in row && 'port' in row && 'protocol' in row) {
      return 'runners.proxies';
    }
    if ('total_tasks' in row && 'workflow_id' in row) {
      return 'automa.campaign_runs';
    }
    if ('triggerSummary' in row || 'nodeCount' in row) {
      return 'automa.workflows';
    }
    if ('tenant_count' in row && ('email' in row || 'full_name' in row)) {
      return 'public.profiles';
    }
  }

  const normalizedPath = (routePath || '').split('?')[0] || '';
  for (const entry of ROUTE_RESOURCE_MAP) {
    if (entry.pattern.test(normalizedPath)) {
      return entry.resource;
    }
  }

  return 'public.tenants';
}

/**
 * Evaluates Row-Level Security (RLS) policy decisions for a specific table row.
 */
export function evaluateRowRlsPolicy(
  resource: SupabaseResourceKey,
  row: null | Record<string, any> | undefined,
  access?: EffectiveAccess | null,
): RowRlsEvaluation {
  const tableSchema =
    SUPABASE_TABLE_REGISTRY[resource] ??
    SUPABASE_TABLE_REGISTRY['public.tenants'];
  const decisions = tableSchema.evaluateRls(row ?? {}, access);
  return {
    ...decisions,
    resource: tableSchema.resource,
    schema: tableSchema.schema,
    table: tableSchema.table,
  };
}

const IGNORED_INTERNAL_ROW_KEYS = new Set([
  '_X_ROW_CHILD',
  '_X_ROW_KEY',
  'definition',
  'deliveries',
  'dependencies',
  'device_token_hash',
  'guest_claim_token_hash',
  'items',
  'manifest',
  'member_roles',
  'password_hash',
  'permissions',
  'roles',
  'tenant_members',
  'variants',
  'webhook_secret',
  'workspaces',
]);

function humanizeFieldKey(key: string): string {
  const cleaned = key.replaceAll('_', ' ').trim();
  if (!cleaned) return key;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function inferRuntimeFieldType(
  field: string,
  value: unknown,
): DynamicFieldType {
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (value && typeof value === 'object') {
    return 'json';
  }
  if (field === 'id' || field.endsWith('_id')) {
    return 'uuid';
  }
  if (
    field.endsWith('_at') ||
    field.endsWith('_start') ||
    field.endsWith('_end')
  ) {
    return 'datetime';
  }
  if (
    field.includes('description') ||
    field.includes('note') ||
    field === 'user_agent'
  ) {
    return 'textarea';
  }
  return 'text';
}

export interface BuildDynamicVxeFormSchemaInput {
  access?: EffectiveAccess | null;
  gridColumns?: Array<{
    field?: string;
    title?: string;
  }>;
  resource: SupabaseResourceKey;
  row: null | Record<string, any> | undefined;
  translate?: (key: string) => string;
}

/**
 * Dynamically builds the complete `VxeForm` field schema by merging:
 * 1. `gridOptions.columns` (for localized titles and column priority)
 * 2. `SUPABASE_TABLE_REGISTRY[resource].columns` (for DB types, Enum options, and mutability)
 * 3. Runtime `row` keys (surfacing any remaining fields hidden on mobile `< 640px`)
 */
export function buildDynamicVxeFormSchema(
  input: BuildDynamicVxeFormSchemaInput,
): {
  fields: DynamicVxeFormField[];
  rls: RowRlsEvaluation;
  title: string;
} {
  const translate = input.translate ?? ((k: string) => k);
  const row = input.row ?? {};
  const tableSchema =
    SUPABASE_TABLE_REGISTRY[input.resource] ??
    SUPABASE_TABLE_REGISTRY['public.tenants'];
  const rls = evaluateRowRlsPolicy(input.resource, row, input.access);

  // Map column titles from gridColumns
  const gridTitleMap = new Map<string, string>();
  if (Array.isArray(input.gridColumns)) {
    for (const col of input.gridColumns) {
      if (col?.field && col.field !== 'actions' && col.title) {
        gridTitleMap.set(col.field, translate(col.title));
      }
    }
  }

  // Ordered union of fields: schema columns first, then grid columns, then remaining row keys
  const orderedFieldNames: string[] = [];
  const seen = new Set<string>();

  const pushField = (field?: string) => {
    if (
      !field ||
      field === 'actions' ||
      field === 'action' ||
      IGNORED_INTERNAL_ROW_KEYS.has(field) ||
      seen.has(field)
    ) {
      return;
    }
    if (field === 'is_system' && 'is_core' in row) {
      return;
    }
    // Skip undefined values that are neither in row nor editable in schema
    const colMeta = tableSchema.columns[field];
    if (!(field in row) && !colMeta?.editable) {
      return;
    }
    // Skip array properties on row (e.g. workspaces[], roles[]) to keep VxeForm scalar/JSON-clean
    if (Array.isArray(row[field])) {
      return;
    }
    seen.add(field);
    orderedFieldNames.push(field);
  };

  for (const key of Object.keys(tableSchema.columns)) {
    pushField(key);
  }
  if (Array.isArray(input.gridColumns)) {
    for (const col of input.gridColumns) {
      pushField(col?.field);
    }
  }
  for (const key of Object.keys(row)) {
    pushField(key);
  }

  const fields: DynamicVxeFormField[] = orderedFieldNames.map((field) => {
    const colMeta = tableSchema.columns[field];
    const rawValue = row[field];
    const type: DynamicFieldType =
      colMeta?.type ?? inferRuntimeFieldType(field, rawValue);

    const isFieldLocked = colMeta?.isFieldLocked?.(row) ?? false;
    const editable = Boolean(
      colMeta?.editable && rls.canUpdate.allowed && !isFieldLocked,
    );

    const rawTitle =
      gridTitleMap.get(field) ||
      (colMeta?.labelKey ? translate(colMeta.labelKey) : '') ||
      humanizeFieldKey(field);

    const options = colMeta?.enumMeta
      ? buildEnumFilterOptions(colMeta.enumMeta, translate, {
          includeAll: false,
        })
      : colMeta?.options;

    const statusMeta = colMeta?.enumMeta
      ? getStatusToneMeta(String(rawValue ?? ''), colMeta.enumMeta)
      : undefined;

    let group: DynamicVxeFormField['group'] = 'readonly';
    if (type === 'json') {
      group = 'json';
    } else if (editable) {
      group = 'editable';
    }

    return {
      editable,
      field,
      group,
      max: colMeta?.max,
      min: colMeta?.min,
      options,
      required: colMeta?.required,
      statusMeta,
      title: rawTitle,
      type,
    };
  });

  // Sort so editable fields appear first, followed by readonly metadata, then JSON payloads
  const groupPriority: Record<DynamicVxeFormField['group'], number> = {
    editable: 0,
    readonly: 1,
    json: 2,
  };
  fields.sort((a, b) => groupPriority[a.group] - groupPriority[b.group]);

  const titleField = tableSchema.titleField || 'name';
  const rowTitle = String(
    row[titleField] ||
      row.name ||
      row.display_name ||
      row.full_name ||
      row.order_code ||
      row.reference_code ||
      row.host ||
      row.id ||
      tableSchema.table,
  );

  return {
    fields,
    rls,
    title: rowTitle,
  };
}

/**
 * Extracts only dirty (modified) columns that are marked `editable: true`
 * in `SUPABASE_TABLE_REGISTRY[resource]`, preventing invalid PostgREST PATCH payloads.
 */
export function computeDirtyMutablePayload(
  originalRow: null | Record<string, any> | undefined,
  formData: Record<string, any>,
  resource: SupabaseResourceKey,
): Record<string, any> {
  const tableSchema = SUPABASE_TABLE_REGISTRY[resource];
  if (!tableSchema || !originalRow) {
    return {};
  }

  const payload: Record<string, any> = {};

  for (const [field, colMeta] of Object.entries(tableSchema.columns)) {
    if (!colMeta.editable || colMeta.isFieldLocked?.(originalRow)) {
      continue;
    }
    if (!(field in formData)) {
      continue;
    }

    let nextVal = formData[field];
    const prevVal = originalRow[field];

    if (colMeta.type === 'number' && nextVal !== '' && nextVal !== null) {
      const parsed = Number(nextVal);
      if (!Number.isNaN(parsed)) {
        nextVal = parsed;
      }
    } else if (colMeta.type === 'json' && typeof nextVal === 'string') {
      try {
        nextVal = JSON.parse(nextVal);
      } catch {
        // Keep raw if invalid JSON
      }
    }

    const isSame =
      colMeta.type === 'json'
        ? JSON.stringify(prevVal ?? null) === JSON.stringify(nextVal ?? null)
        : prevVal === nextVal;

    if (!isSame) {
      payload[field] = nextVal;
    }
  }

  return payload;
}

/**
 * Executes a real PostgREST `PATCH` request against the resource's Supabase schema & table
 * for dirty mutable columns, enforcing Row-Level Security (RLS).
 */
export async function executeDynamicSupabasePatch<
  T extends Record<string, any> = Record<string, any>,
>(
  resource: SupabaseResourceKey,
  originalRow: T,
  formData: Record<string, any>,
  access?: EffectiveAccess | null,
): Promise<{
  dirtyPayload: Record<string, any>;
  skipped: boolean;
  updatedRow: T;
}> {
  const tableSchema = SUPABASE_TABLE_REGISTRY[resource];
  const rls = evaluateRowRlsPolicy(resource, originalRow, access);

  if (!rls.canUpdate.allowed) {
    throw new Error(
      rls.canUpdate.reasonKey ||
        `RLS policy (${rls.canUpdate.policyName}) denied UPDATE on ${resource}`,
    );
  }

  const dirtyPayload = computeDirtyMutablePayload(
    originalRow,
    formData,
    resource,
  );

  if (Object.keys(dirtyPayload).length === 0) {
    return {
      dirtyPayload,
      skipped: true,
      updatedRow: originalRow,
    };
  }

  const pk = tableSchema.primaryKey || 'id';
  const rowId = originalRow?.[pk];
  if (rowId === undefined || rowId === null || rowId === '') {
    const merged = { ...originalRow, ...dirtyPayload } as T;
    return {
      dirtyPayload,
      skipped: false,
      updatedRow: merged,
    };
  }

  const rows = await supabaseRequest<T[]>(
    `/rest/v1/${tableSchema.table}?${encodeURIComponent(pk)}=eq.${encodeURIComponent(String(rowId))}`,
    {
      body: JSON.stringify(dirtyPayload),
      method: 'PATCH',
      preferRepresentation: true,
      schema: tableSchema.schema,
    },
  );

  const serverRow = Array.isArray(rows) && rows[0] ? rows[0] : null;
  const updatedRow = {
    ...originalRow,
    ...dirtyPayload,
    ...serverRow,
  } as T;

  return {
    dirtyPayload,
    skipped: false,
    updatedRow,
  };
}
