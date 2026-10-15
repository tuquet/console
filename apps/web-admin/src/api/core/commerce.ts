import type {
  CommerceOrderStatus,
  CommerceProductType,
  CommerceProductVisibility,
  CommerceStockMode,
  CommerceStockStatus,
  PaymentChannelType,
} from '@vben/constants';

import type { PaymentIntentItem } from './billing';

import {
  COMMERCE_ORDER_STATUS,
  COMMERCE_PRODUCT_TYPE,
  COMMERCE_PRODUCT_VISIBILITY,
  COMMERCE_STOCK_MODE,
  COMMERCE_STOCK_STATUS,
  FILTER_ALL,
  PAYMENT_CHANNEL,
  STORAGE_KEYS,
} from '@vben/constants';

import { mapRawPaymentIntent } from './billing';
import { supabaseRequest } from './supabase-client';

export {
  COMMERCE_ORDER_STATUS,
  COMMERCE_PRODUCT_TYPE,
  COMMERCE_PRODUCT_VISIBILITY,
  COMMERCE_STOCK_MODE,
  COMMERCE_STOCK_STATUS,
};
export type {
  CommerceOrderStatus,
  CommerceProductType,
  CommerceProductVisibility,
  CommerceStockMode,
  CommerceStockStatus,
};

export interface CommerceCategoryItem {
  created_at: string;
  description: null | string;
  icon: null | string;
  id: string;
  is_active: boolean;
  name: string;
  slug: string;
  sort_order: number;
  updated_at: string;
}

export interface CommerceProductVariantItem {
  available_stock: number;
  compare_at_credits: null | number;
  created_at: string;
  fulfillment_payload: Record<string, any>;
  id: string;
  is_active: boolean;
  max_qty: number;
  min_qty: number;
  name: string;
  price_credits: number;
  product_id: string;
  sku: string;
  sold_count: number;
  sort_order: number;
  stock_mode: CommerceStockMode;
  updated_at: string;
}

export interface CommerceProductItem {
  category_id: null | string;
  created_at: string;
  description: null | string;
  fulfillment_config: Record<string, any>;
  id: string;
  is_active: boolean;
  name: string;
  product_type: CommerceProductType;
  short_description: null | string;
  slug: string;
  sort_order: number;
  tags: string[];
  thumbnail_url: null | string;
  updated_at: string;
  variants?: CommerceProductVariantItem[];
  visibility: CommerceProductVisibility;
}

export interface CommerceStockItem {
  batch_code: null | string;
  created_at: string;
  id: string;
  metadata: Record<string, any>;
  order_item_id: null | string;
  public_hint: null | string;
  reserved_until: null | string;
  secret_payload: string;
  sold_at: null | string;
  sold_to_tenant_id: null | string;
  status: CommerceStockStatus;
  updated_at: string;
  variant_id: string;
}

export interface CommerceOrderItem {
  created_at: string;
  fulfilled_quantity: number;
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_type: CommerceProductType;
  quantity: number;
  total_price_credits: number;
  unit_price_credits: number;
  variant_id: string;
  variant_name: string;
}

export interface CommerceOrderDeliveryItem {
  buyer_tenant_id: null | string;
  created_at: string;
  delivered_payload: Record<string, any>;
  delivery_type: CommerceProductType;
  download_count: number;
  expires_at: null | string;
  id: string;
  max_downloads: null | number;
  order_id: string;
  order_item_id: string;
  stock_item_id: null | string;
}

export interface CommerceOrderRecord {
  buyer_email: null | string;
  buyer_tenant_id: null | string;
  buyer_user_id: null | string;
  cancelled_at: null | string;
  created_at: string;
  discount_credits: number;
  fulfilled_at: null | string;
  id: string;
  metadata: Record<string, any>;
  notes: null | string;
  order_code: string;
  paid_at: null | string;
  payment_intent_id: null | string;
  payment_method: PaymentChannelType;
  status: CommerceOrderStatus;
  subtotal_credits: number;
  total_credits: number;
  updated_at: string;
}

export interface CreateCheckoutOrderLineInput {
  quantity: number;
  variant_id: string;
}

export interface CreateCheckoutOrderParams {
  buyer_email?: null | string;
  buyer_tenant_id?: null | string;
  gateway_code?: null | string;
  idempotency_key?: null | string;
  items: CreateCheckoutOrderLineInput[];
  payment_method: PaymentChannelType;
}

export interface CreateCheckoutOrderResult {
  claim_token: null | string;
  fulfillment: null | {
    deliveries: CommerceOrderDeliveryItem[];
    fulfilled: boolean;
    idempotent: boolean;
    order_code: string;
    order_id: string;
  };
  order: CommerceOrderRecord;
  payment_intent: PaymentIntentItem;
}

export interface ImportStockBatchResult {
  available_stock: number;
  imported_count: number;
  input_count: number;
  skipped_duplicates: number;
  variant_id: string;
}

export interface GuestOrderLookupResult {
  deliveries: CommerceOrderDeliveryItem[];
  items: CommerceOrderItem[];
  order: CommerceOrderRecord;
}

export function mapRawCommerceCategory(raw: any): CommerceCategoryItem {
  return {
    created_at: String(raw?.created_at || ''),
    description: raw?.description ? String(raw.description) : null,
    icon: raw?.icon ? String(raw.icon) : null,
    id: String(raw?.id || ''),
    is_active: raw?.is_active !== false,
    name: String(raw?.name || ''),
    slug: String(raw?.slug || ''),
    sort_order: Number(raw?.sort_order ?? 0),
    updated_at: String(raw?.updated_at || ''),
  };
}

export function mapRawProductVariant(raw: any): CommerceProductVariantItem {
  return {
    available_stock: Math.trunc(Number(raw?.available_stock ?? 0)),
    compare_at_credits:
      raw?.compare_at_credits === null || raw?.compare_at_credits === undefined
        ? null
        : Math.trunc(Number(raw.compare_at_credits)),
    created_at: String(raw?.created_at || ''),
    fulfillment_payload:
      raw?.fulfillment_payload && typeof raw.fulfillment_payload === 'object'
        ? raw.fulfillment_payload
        : {},
    id: String(raw?.id || ''),
    is_active: raw?.is_active !== false,
    max_qty: Math.trunc(Number(raw?.max_qty ?? 100)),
    min_qty: Math.trunc(Number(raw?.min_qty ?? 1)),
    name: String(raw?.name || ''),
    price_credits: Math.trunc(Number(raw?.price_credits ?? 0)),
    product_id: String(raw?.product_id || ''),
    sku: String(raw?.sku || ''),
    sold_count: Math.trunc(Number(raw?.sold_count ?? 0)),
    sort_order: Number(raw?.sort_order ?? 0),
    stock_mode: (raw?.stock_mode ||
      COMMERCE_STOCK_MODE.UNLIMITED) as CommerceStockMode,
    updated_at: String(raw?.updated_at || ''),
  };
}

export function mapRawCommerceProduct(raw: any): CommerceProductItem {
  return {
    category_id: raw?.category_id ? String(raw.category_id) : null,
    created_at: String(raw?.created_at || ''),
    description: raw?.description ? String(raw.description) : null,
    fulfillment_config:
      raw?.fulfillment_config && typeof raw.fulfillment_config === 'object'
        ? raw.fulfillment_config
        : {},
    id: String(raw?.id || ''),
    is_active: raw?.is_active !== false,
    name: String(raw?.name || ''),
    product_type: (raw?.product_type ||
      COMMERCE_PRODUCT_TYPE.SERIAL_STOCK) as CommerceProductType,
    short_description: raw?.short_description
      ? String(raw.short_description)
      : null,
    slug: String(raw?.slug || ''),
    sort_order: Number(raw?.sort_order ?? 0),
    tags: Array.isArray(raw?.tags) ? raw.tags.map(String) : [],
    thumbnail_url: raw?.thumbnail_url ? String(raw.thumbnail_url) : null,
    updated_at: String(raw?.updated_at || ''),
    variants: Array.isArray(raw?.product_variants ?? raw?.variants)
      ? (raw.product_variants ?? raw.variants).map((v: any) =>
          mapRawProductVariant(v),
        )
      : undefined,
    visibility: (raw?.visibility ||
      COMMERCE_PRODUCT_VISIBILITY.PUBLIC) as CommerceProductVisibility,
  };
}

export function mapRawCommerceOrder(raw: any): CommerceOrderRecord {
  return {
    buyer_email: raw?.buyer_email ? String(raw.buyer_email) : null,
    buyer_tenant_id: raw?.buyer_tenant_id ? String(raw.buyer_tenant_id) : null,
    buyer_user_id: raw?.buyer_user_id ? String(raw.buyer_user_id) : null,
    cancelled_at: raw?.cancelled_at ? String(raw.cancelled_at) : null,
    created_at: String(raw?.created_at || ''),
    discount_credits: Math.trunc(Number(raw?.discount_credits ?? 0)),
    fulfilled_at: raw?.fulfilled_at ? String(raw.fulfilled_at) : null,
    id: String(raw?.id || ''),
    metadata:
      raw?.metadata && typeof raw.metadata === 'object' ? raw.metadata : {},
    notes: raw?.notes ? String(raw.notes) : null,
    order_code: String(raw?.order_code || ''),
    paid_at: raw?.paid_at ? String(raw.paid_at) : null,
    payment_intent_id: raw?.payment_intent_id
      ? String(raw.payment_intent_id)
      : null,
    payment_method: (raw?.payment_method ||
      PAYMENT_CHANNEL.INTERNAL_WALLET) as PaymentChannelType,
    status: (raw?.status ||
      COMMERCE_ORDER_STATUS.PENDING_PAYMENT) as CommerceOrderStatus,
    subtotal_credits: Math.trunc(Number(raw?.subtotal_credits ?? 0)),
    total_credits: Math.trunc(Number(raw?.total_credits ?? 0)),
    updated_at: String(raw?.updated_at || ''),
  };
}

export function mapRawOrderDelivery(raw: any): CommerceOrderDeliveryItem {
  return {
    buyer_tenant_id: raw?.buyer_tenant_id ? String(raw.buyer_tenant_id) : null,
    created_at: String(raw?.created_at || ''),
    delivered_payload:
      raw?.delivered_payload && typeof raw.delivered_payload === 'object'
        ? raw.delivered_payload
        : {},
    delivery_type: (raw?.delivery_type ||
      COMMERCE_PRODUCT_TYPE.SERIAL_STOCK) as CommerceProductType,
    download_count: Math.trunc(Number(raw?.download_count ?? 0)),
    expires_at: raw?.expires_at ? String(raw.expires_at) : null,
    id: String(raw?.id || ''),
    max_downloads:
      raw?.max_downloads === null || raw?.max_downloads === undefined
        ? null
        : Math.trunc(Number(raw.max_downloads)),
    order_id: String(raw?.order_id || ''),
    order_item_id: String(raw?.order_item_id || ''),
    stock_item_id: raw?.stock_item_id ? String(raw.stock_item_id) : null,
  };
}

/**
 * Fetch active product categories ordered by sort_order.
 */
export async function getCommerceCategoriesApi(options?: {
  includeInactive?: boolean;
  skipAuth?: boolean;
}): Promise<CommerceCategoryItem[]> {
  const filter = options?.includeInactive ? '' : 'is_active=eq.true&';
  const rows = await supabaseRequest<any[]>(
    `/rest/v1/categories?${filter}select=*&order=sort_order.asc,name.asc`,
    {
      method: 'GET',
      schema: 'commerce',
      skipAuth: options?.skipAuth,
    },
  );
  return Array.isArray(rows)
    ? rows.map((row) => mapRawCommerceCategory(row))
    : [];
}

/**
 * Fetch digital products with embedded product_variants.
 */
export async function getCommerceProductsApi(options?: {
  categoryId?: string;
  includeInactive?: boolean;
  productType?: CommerceProductType;
  skipAuth?: boolean;
}): Promise<CommerceProductItem[]> {
  const filters: string[] = [];
  if (!options?.includeInactive) {
    filters.push('is_active=eq.true');
  }
  if (options?.categoryId) {
    filters.push(`category_id=eq.${encodeURIComponent(options.categoryId)}`);
  }
  if (options?.productType) {
    filters.push(`product_type=eq.${encodeURIComponent(options.productType)}`);
  }
  const queryPrefix = filters.length > 0 ? `${filters.join('&')}&` : '';
  const rows = await supabaseRequest<any[]>(
    `/rest/v1/products?${queryPrefix}select=*,product_variants(*)&order=sort_order.asc,created_at.desc`,
    {
      method: 'GET',
      schema: 'commerce',
      skipAuth: options?.skipAuth,
    },
  );
  return Array.isArray(rows)
    ? rows.map((row) => mapRawCommerceProduct(row))
    : [];
}

/**
 * Fetch variants for a specific product or all products.
 */
export async function getCommerceProductVariantsApi(
  productId?: string,
): Promise<CommerceProductVariantItem[]> {
  const filter = productId
    ? `product_id=eq.${encodeURIComponent(productId)}&`
    : '';
  const rows = await supabaseRequest<any[]>(
    `/rest/v1/product_variants?${filter}select=*&order=sort_order.asc,price_credits.asc`,
    {
      method: 'GET',
      schema: 'commerce',
    },
  );
  return Array.isArray(rows)
    ? rows.map((row) => mapRawProductVariant(row))
    : [];
}

/**
 * Create a digital checkout order (supports Tenant Instant Xu Wallet, External Gateways, and Guest Checkout).
 */
export async function createCheckoutOrderApi(
  params: CreateCheckoutOrderParams,
  options?: { skipAuth?: boolean },
): Promise<CreateCheckoutOrderResult> {
  const res = await supabaseRequest<any>('/rest/v1/rpc/create_checkout_order', {
    body: JSON.stringify({
      _buyer_email: params.buyer_email ?? null,
      _buyer_tenant_id: params.buyer_tenant_id ?? null,
      _gateway_code: params.gateway_code ?? null,
      _idempotency_key: params.idempotency_key ?? null,
      _items: params.items,
      _payment_method: params.payment_method,
    }),
    method: 'POST',
    schema: 'commerce',
    skipAuth: options?.skipAuth,
  });

  return {
    claim_token: res?.claim_token ? String(res.claim_token) : null,
    fulfillment: res?.fulfillment
      ? {
          deliveries: Array.isArray(res.fulfillment.deliveries)
            ? res.fulfillment.deliveries.map((d: any) => mapRawOrderDelivery(d))
            : [],
          fulfilled: Boolean(res.fulfillment.fulfilled),
          idempotent: Boolean(res.fulfillment.idempotent),
          order_code: String(res.fulfillment.order_code || ''),
          order_id: String(res.fulfillment.order_id || ''),
        }
      : null,
    order: mapRawCommerceOrder(res?.order),
    payment_intent: mapRawPaymentIntent(res?.payment_intent),
  };
}

/**
 * Fetch orders for a specific Tenant workspace.
 */
export async function getTenantOrdersApi(
  tenantId: string,
  limit = 50,
): Promise<CommerceOrderRecord[]> {
  const rows = await supabaseRequest<any[]>(
    `/rest/v1/orders?buyer_tenant_id=eq.${encodeURIComponent(tenantId)}&select=*&order=created_at.desc&limit=${limit}`,
    {
      method: 'GET',
      schema: 'commerce',
    },
  );
  return Array.isArray(rows) ? rows.map((row) => mapRawCommerceOrder(row)) : [];
}

/**
 * Fetch fulfilled digital deliverables for an order.
 */
export async function getOrderDeliveriesApi(
  orderId: string,
): Promise<CommerceOrderDeliveryItem[]> {
  const rows = await supabaseRequest<any[]>(
    `/rest/v1/order_deliveries?order_id=eq.${encodeURIComponent(orderId)}&select=*&order=created_at.asc`,
    {
      method: 'GET',
      schema: 'commerce',
    },
  );
  return Array.isArray(rows) ? rows.map((row) => mapRawOrderDelivery(row)) : [];
}

/**
 * Retrieve guest order status and fulfilled deliverables using order_code + claim_token.
 */
export async function getGuestOrderDeliveriesApi(
  orderCode: string,
  claimToken: string,
): Promise<GuestOrderLookupResult> {
  const res = await supabaseRequest<any>(
    '/rest/v1/rpc/get_guest_order_deliveries',
    {
      body: JSON.stringify({
        _claim_token: claimToken,
        _order_code: orderCode,
      }),
      method: 'POST',
      schema: 'commerce',
      skipAuth: true,
    },
  );

  return {
    deliveries: Array.isArray(res?.deliveries)
      ? res.deliveries.map((d: any) => mapRawOrderDelivery(d))
      : [],
    items: Array.isArray(res?.items) ? res.items : [],
    order: mapRawCommerceOrder(res?.order),
  };
}

/**
 * [Platform Admin] Upsert a product category.
 */
export async function upsertCommerceCategoryAdminApi(
  payload: Partial<CommerceCategoryItem> & { name: string; slug: string },
): Promise<CommerceCategoryItem> {
  const rows = await supabaseRequest<any[]>(
    '/rest/v1/categories?on_conflict=slug',
    {
      body: JSON.stringify(payload),
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      method: 'POST',
      preferRepresentation: true,
      schema: 'commerce',
    },
  );
  return mapRawCommerceCategory(Array.isArray(rows) ? rows[0] : rows);
}

/**
 * [Platform Admin] Upsert a digital product.
 */
export async function upsertCommerceProductAdminApi(
  payload: Partial<CommerceProductItem> & {
    name: string;
    product_type: CommerceProductType;
    slug: string;
  },
): Promise<CommerceProductItem> {
  const rows = await supabaseRequest<any[]>(
    '/rest/v1/products?on_conflict=slug',
    {
      body: JSON.stringify(payload),
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      method: 'POST',
      preferRepresentation: true,
      schema: 'commerce',
    },
  );
  return mapRawCommerceProduct(Array.isArray(rows) ? rows[0] : rows);
}

/**
 * [Platform Admin] Upsert a product variant (SKU).
 */
export async function upsertProductVariantAdminApi(
  payload: Partial<CommerceProductVariantItem> & {
    name: string;
    price_credits: number;
    product_id: string;
    sku: string;
  },
): Promise<CommerceProductVariantItem> {
  const rows = await supabaseRequest<any[]>(
    '/rest/v1/product_variants?on_conflict=sku',
    {
      body: JSON.stringify(payload),
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      method: 'POST',
      preferRepresentation: true,
      schema: 'commerce',
    },
  );
  return mapRawProductVariant(Array.isArray(rows) ? rows[0] : rows);
}

/**
 * [Platform Admin] Bulk import serialized stock lines (uid|pass|2fa, keys, proxies) with deduplication.
 */
export async function importStockBatchAdminApi(params: {
  batch_code?: null | string;
  lines: string[];
  variant_id: string;
}): Promise<ImportStockBatchResult> {
  const res = await supabaseRequest<any>('/rest/v1/rpc/import_stock_batch', {
    body: JSON.stringify({
      _batch_code: params.batch_code ?? null,
      _lines: params.lines,
      _variant_id: params.variant_id,
    }),
    method: 'POST',
    schema: 'commerce',
  });

  return {
    available_stock: Math.trunc(Number(res?.available_stock ?? 0)),
    imported_count: Math.trunc(Number(res?.imported_count ?? 0)),
    input_count: Math.trunc(Number(res?.input_count ?? 0)),
    skipped_duplicates: Math.trunc(Number(res?.skipped_duplicates ?? 0)),
    variant_id: String(res?.variant_id || params.variant_id),
  };
}

/**
 * [Platform Admin] List all orders across all tenants and guests.
 */
export async function getAllOrdersAdminApi(
  status?: CommerceOrderStatus,
  limit = 100,
): Promise<CommerceOrderRecord[]> {
  const filter = status ? `status=eq.${encodeURIComponent(status)}&` : '';
  const rows = await supabaseRequest<any[]>(
    `/rest/v1/orders?${filter}select=*&order=created_at.desc&limit=${limit}`,
    {
      method: 'GET',
      schema: 'commerce',
    },
  );
  return Array.isArray(rows) ? rows.map((row) => mapRawCommerceOrder(row)) : [];
}

/**
 * [Platform Admin] Manually trigger or retry atomic fulfillment for an order.
 */
export async function fulfillOrderAdminApi(orderId: string): Promise<{
  deliveries: CommerceOrderDeliveryItem[];
  fulfilled: boolean;
  idempotent: boolean;
  order_code: string;
  order_id: string;
}> {
  const res = await supabaseRequest<any>('/rest/v1/rpc/fulfill_order', {
    body: JSON.stringify({
      _order_id: orderId,
    }),
    method: 'POST',
    schema: 'commerce',
  });

  return {
    deliveries: Array.isArray(res?.deliveries)
      ? res.deliveries.map((d: any) => mapRawOrderDelivery(d))
      : [],
    fulfilled: Boolean(res?.fulfilled),
    idempotent: Boolean(res?.idempotent),
    order_code: String(res?.order_code || ''),
    order_id: String(res?.order_id || orderId),
  };
}

/**
 * Pure helper to filter commerce products for Store and Admin VXE Grid
 */
export function filterCommerceProducts(
  items: CommerceProductItem[],
  filters?: {
    category_id?: string;
    product_type?: string;
    search?: string;
    visibility?: string;
  },
): CommerceProductItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  let result = items;
  if (filters?.category_id && filters.category_id !== FILTER_ALL) {
    result = result.filter((p) => p.category_id === filters.category_id);
  }
  if (filters?.product_type && filters.product_type !== FILTER_ALL) {
    result = result.filter((p) => p.product_type === filters.product_type);
  }
  if (filters?.visibility && filters.visibility !== FILTER_ALL) {
    result = result.filter((p) => p.visibility === filters.visibility);
  }
  if (filters?.search) {
    const kw = String(filters.search).toLowerCase().trim();
    if (kw) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          p.slug.toLowerCase().includes(kw) ||
          (p.short_description &&
            p.short_description.toLowerCase().includes(kw)) ||
          (Array.isArray(p.variants) &&
            p.variants.some(
              (v) =>
                v.sku.toLowerCase().includes(kw) ||
                v.name.toLowerCase().includes(kw),
            )),
      );
    }
  }
  return result;
}

/**
 * Pure helper to filter commerce orders for Tenant Orders & Admin Orders VXE Grid
 */
export function filterCommerceOrders(
  items: CommerceOrderRecord[],
  filters?: {
    payment_method?: string;
    search?: string;
    status?: string;
  },
): CommerceOrderRecord[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  let result = items;
  if (filters?.status && filters.status !== FILTER_ALL) {
    result = result.filter((o) => o.status === filters.status);
  }
  if (filters?.payment_method && filters.payment_method !== FILTER_ALL) {
    result = result.filter((o) => o.payment_method === filters.payment_method);
  }
  if (filters?.search) {
    const kw = String(filters.search).toLowerCase().trim();
    if (kw) {
      result = result.filter(
        (o) =>
          o.order_code.toLowerCase().includes(kw) ||
          o.id.toLowerCase().includes(kw) ||
          (o.buyer_email && o.buyer_email.toLowerCase().includes(kw)) ||
          (o.buyer_tenant_id && o.buyer_tenant_id.toLowerCase().includes(kw)),
      );
    }
  }
  return result;
}

export interface SavedGuestOrderItem {
  buyer_email: null | string;
  claim_token: string;
  created_at: string;
  order_code: string;
  total_credits: number;
}

const GUEST_ORDERS_STORAGE_KEY = STORAGE_KEYS.GUEST_ORDERS;

/**
 * Retrieve saved guest orders from localStorage for Public Storefront lookup convenience.
 */
export function getSavedGuestOrders(): SavedGuestOrderItem[] {
  try {
    const raw = localStorage.getItem(GUEST_ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && x.order_code && x.claim_token)
      .map((x) => ({
        buyer_email: x.buyer_email ? String(x.buyer_email) : null,
        claim_token: String(x.claim_token),
        created_at: String(x.created_at || new Date().toISOString()),
        order_code: String(x.order_code),
        total_credits: Math.trunc(Number(x.total_credits ?? 0)),
      }));
  } catch {
    return [];
  }
}

/**
 * Persist a guest order + claim_token into localStorage (keeps up to 20 most recent orders).
 */
export function saveGuestOrderLocal(
  item: SavedGuestOrderItem,
): SavedGuestOrderItem[] {
  const existing = getSavedGuestOrders().filter(
    (o) => o.order_code !== item.order_code,
  );
  const updated = [item, ...existing].slice(0, 20);
  try {
    localStorage.setItem(GUEST_ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
  return updated;
}

/**
 * Pure helper: Check whether a commerce product variant is currently in stock and active.
 */
export function isVariantInStock(
  variant: CommerceProductVariantItem | null | undefined,
): boolean {
  if (!variant || !variant.is_active) return false;
  if (variant.stock_mode === 'unlimited') return true;
  return variant.available_stock > 0;
}

/**
 * Pure helper: Extract newline-delimited serial / secret lines from order delivery items.
 */
export function formatSerialDeliveriesText(
  deliveries: CommerceOrderDeliveryItem[],
): string {
  if (!Array.isArray(deliveries) || deliveries.length === 0) return '';
  return deliveries
    .filter((d) => d.delivery_type === 'serial_stock')
    .map(
      (d) =>
        d.delivered_payload?.serial ||
        d.delivered_payload?.secret_line ||
        JSON.stringify(d.delivered_payload),
    )
    .join('\n');
}

/**
 * Shared browser helper: Trigger a UTF-8 text file download for serial deliveries.
 */
export function downloadTextFile(filename: string, content: string): void {
  if (!content) return;
  const blob = new Blob([content], {
    type: 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
