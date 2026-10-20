/**
 * Canonical PostgREST / Supabase Database Schemas
 */
export const SUPABASE_SCHEMA = {
  AUTOMA: 'automa',
  BILLING: 'billing',
  COMMERCE: 'commerce',
  EVENTS: 'events',
  MEDIA: 'media',
  PUBLIC: 'public',
  RUNNERS: 'runners',
} as const;

export type SupabaseSchema =
  (typeof SUPABASE_SCHEMA)[keyof typeof SUPABASE_SCHEMA];

export const SUPABASE_SCHEMA_VALUES = Object.values(
  SUPABASE_SCHEMA,
) as readonly SupabaseSchema[];

/**
 * Canonical Browser LocalStorage Keys for Admin
 */
export const STORAGE_KEYS = {
  ACTIVE_TENANT_ID: 'TUQUET_ACTIVE_TENANT_ID',
  AUTH_BANNER_MODE: 'specter:auth-banner-mode',
  GUEST_ORDERS: 'TUQUET_GUEST_ORDERS',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
