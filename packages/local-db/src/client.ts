import type { Client } from '@libsql/client';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

import * as fullSchema from './schema';
import * as automationSchema from './schema/automation';
import * as systemSchema from './schema/system';
import * as tenantsSchema from './schema/tenants';

export type OperonDb<
  TSchema extends Record<string, unknown> = typeof fullSchema,
> = ReturnType<typeof drizzle<TSchema>>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves the canonical SQLite file path.
 * When domain is provided, returns ~/.operon/data/<domain>.sqlite.
 * When omitted, returns default ~/.operon/data/operon.sqlite.
 */
export function getCanonicalSqlitePath(domain?: string): string {
  const dataDir = path.join(os.homedir(), '.operon', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const fileName = domain ? `${domain}.sqlite` : 'operon.sqlite';
  return path.join(dataDir, fileName);
}

/**
 * Returns the default schema bundle associated with a domain.
 */
export function getDomainSchema(domain: string) {
  switch (domain.toLowerCase()) {
    case 'automation': {
      return automationSchema;
    }
    case 'system': {
      return systemSchema;
    }
    case 'tenants': {
      return tenantsSchema;
    }
    default: {
      return fullSchema;
    }
  }
}

/**
 * Initializes and returns a typed Drizzle ORM client for a specific micro-app domain.
 */
export function getDomainDb<
  TSchema extends Record<string, unknown> = typeof fullSchema,
>(
  domain: 'automation' | 'system' | 'tenants' | string,
  customSchema?: TSchema,
  customUrl?: string,
): OperonDb<TSchema> {
  const schemaToUse = (customSchema || getDomainSchema(domain)) as TSchema;
  const defaultPath = getCanonicalSqlitePath(domain);
  const fileUrl = `file:${defaultPath.replaceAll('\\', '/')}`;
  const envKey = `OPERON_${domain.toUpperCase()}_SQLITE_URL`;
  const url = customUrl || process.env[envKey] || fileUrl;

  const client = createClient({ url });
  return drizzle(client, { schema: schemaToUse });
}

/**
 * Initializes and returns a typed Drizzle ORM client for the unified local SQLite database.
 * Backward compatible with existing Operon code.
 */
export function getLocalDb(customUrl?: string): OperonDb<typeof fullSchema> {
  const defaultPath = getCanonicalSqlitePath();
  const fileUrl = `file:${defaultPath.replaceAll('\\', '/')}`;
  const url = customUrl || process.env.OPERON_SQLITE_URL || fileUrl;

  const client = createClient({ url });
  return drizzle(client, { schema: fullSchema });
}

/**
 * Helper to ensure pre-Drizzle Operon databases are safely upgraded to the latest schema.
 */
async function ensureLegacyCompatibility(client: Client): Promise<void> {
  try {
    const tableRes = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='jobs'",
    );
    if (tableRes.rows.length > 0) {
      const pragmaRes = await client.execute('PRAGMA table_info(jobs)');
      const existingCols = new Set(pragmaRes.rows.map((r: any) => r.name));

      const missingCols: Array<{ name: string; ddl: string }> = [
        { name: 'workflow_id', ddl: 'text' },
        { name: 'profile_id', ddl: 'text' },
        { name: 'device_id', ddl: 'text' },
        { name: 'result', ddl: "text DEFAULT '{}' NOT NULL" },
        { name: 'started_at', ddl: 'text' },
        { name: 'finished_at', ddl: 'text' },
      ];

      for (const col of missingCols) {
        if (!existingCols.has(col.name)) {
          await client.execute(
            `ALTER TABLE jobs ADD COLUMN ${col.name} ${col.ddl}`,
          );
        }
      }
    }
  } catch {
    // Non-fatal if legacy check or column addition fails
  }
}

/**
 * Automatically applies pending Drizzle migrations to the target SQLite database.
 * Runs idempotently on both fresh installations and legacy upgrades.
 */
export async function runLocalMigrations<T extends Record<string, unknown>>(
  db: OperonDb<T>,
  migrationsFolder?: string,
): Promise<void> {
  const targetFolder =
    migrationsFolder || path.resolve(__dirname, './migrations');

  if (!fs.existsSync(targetFolder)) {
    return;
  }

  const client = (db as unknown as { $client?: Client }).$client;
  if (client && typeof client.execute === 'function') {
    await ensureLegacyCompatibility(client);
  }

  try {
    await migrate(db as unknown as Parameters<typeof migrate>[0], {
      migrationsFolder: targetFolder,
    });

    // Post-migration: seamlessly migrate legacy browsers table to browser_profiles if needed
    if (client && typeof client.execute === 'function') {
      const legacyBrowsers = await client.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='browsers'",
      );
      if (legacyBrowsers.rows.length > 0) {
        await client.execute(`
          INSERT OR IGNORE INTO browser_profiles (id, name, user_agent, timezone, created_at, updated_at)
          SELECT id, name, user_agent, timezone, created_at, updated_at FROM browsers;
        `);
      }
    }
  } catch (error) {
    console.error('[Local-DB] Failed to apply local SQLite migrations:', error);
    throw error;
  }
}
