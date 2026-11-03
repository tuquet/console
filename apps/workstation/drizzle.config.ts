import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { defineConfig } from 'drizzle-kit';

// Default path points to Operon Core local SQLite database (~/.operon/automation/automation.sqlite)
const defaultDbDir = path.join(os.homedir(), '.operon', 'automation');
const defaultDbPath = path.join(defaultDbDir, 'automation.sqlite');

if (!fs.existsSync(defaultDbDir)) {
  fs.mkdirSync(defaultDbDir, { recursive: true });
}

// Ensure valid file: URI format across OS platforms (especially Windows)
const fileUrl = `file:${defaultDbPath.replaceAll('\\', '/')}`;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.OPERON_SQLITE_URL || fileUrl,
  },
});
