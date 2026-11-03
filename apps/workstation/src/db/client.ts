import type { Client } from '@libsql/client';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

import * as schema from './schema';

export type OperonDb = ReturnType<typeof drizzle<typeof schema>>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves the canonical SQLite file path (~/.operon/data/operon.sqlite).
 */
export function getCanonicalSqlitePath(): string {
  const dataDir = path.join(os.homedir(), '.operon', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'operon.sqlite');
}

/**
 * Initializes and returns a typed Drizzle ORM client for local SQLite.
 */
export function getLocalDb(customUrl?: string): OperonDb {
  const defaultPath = getCanonicalSqlitePath();
  const fileUrl = `file:${defaultPath.replaceAll('\\', '/')}`;
  const url = customUrl || process.env.OPERON_SQLITE_URL || fileUrl;

  const client = createClient({ url });
  return drizzle(client, { schema });
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
export async function runLocalMigrations(
  db: OperonDb,
  migrationsFolder?: string,
): Promise<void> {
  const resolvedFolder =
    migrationsFolder || path.resolve(__dirname, './migrations');

  const rawClient = (db as any).$client as Client | undefined;
  if (rawClient && typeof rawClient.execute === 'function') {
    await ensureLegacyCompatibility(rawClient);
  }

  await migrate(db, { migrationsFolder: resolvedFolder });

  // Post-migration: seamlessly migrate legacy browsers table to browser_profiles if needed
  if (rawClient && typeof rawClient.execute === 'function') {
    try {
      const legacyBrowsers = await rawClient.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='browsers'",
      );
      if (legacyBrowsers.rows.length > 0) {
        await rawClient.execute(`
          INSERT OR IGNORE INTO browser_profiles (id, name, user_agent, timezone, created_at, updated_at)
          SELECT id, name, user_agent, timezone, created_at, updated_at FROM browsers;
        `);
      }
    } catch {
      // Best-effort legacy data retention
    }
  }
}
