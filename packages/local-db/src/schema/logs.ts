import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

export interface CiRunStepSnapshot {
  command: string;
  errorCount: number;
  exitCode: null | number;
  lines: Array<{
    lineNo: number;
    noise: boolean;
    packageTag: null | string;
    severity: 'error' | 'info' | 'pass' | 'warn';
    text: string;
  }>;
  name: string;
  seconds: null | number;
  startLine: number;
  status: 'fail' | 'pass' | 'running';
  warnCount: number;
}

export interface SentryFrame {
  colno?: number;
  filename: string;
  function?: string;
  lineno?: number;
}

export interface SentryBreadcrumb {
  category: string;
  data?: Record<string, unknown>;
  level?: 'error' | 'info' | 'warning';
  message: string;
  timestamp: string;
}

// 1. Local CI Runs (collected via dashboard Run CI / local-ci.mjs)
export const ciRuns = sqliteTable(
  'ci_runs',
  {
    id: text('id').primaryKey(),
    suite: text('suite', {
      enum: ['all', 'console', 'core', 'docker', 'glossary'],
    }).notNull(),
    status: text('status', {
      enum: ['empty', 'fail', 'pass', 'running'],
    }).notNull(),
    gitRef: text('git_ref').default('').notNull(),
    totalSeconds: real('total_seconds'),
    errorCount: integer('error_count').default(0).notNull(),
    warnCount: integer('warn_count').default(0).notNull(),
    lineCount: integer('line_count').default(0).notNull(),
    summaryLines: text('summary_lines', { mode: 'json' })
      .$type<string[]>()
      .default([])
      .notNull(),
    steps: text('steps', { mode: 'json' })
      .$type<CiRunStepSnapshot[]>()
      .default([])
      .notNull(),
    startedAt: text('started_at').notNull(),
    finishedAt: text('finished_at'),
  },
  (table) => [
    index('idx_ci_runs_suite_started').on(table.suite, table.startedAt),
  ],
);

// 2. Local Sentry Events (developer errors, stack frames & breadcrumbs)
export const sentryEvents = sqliteTable(
  'sentry_events',
  {
    id: text('id').primaryKey(),
    fingerprint: text('fingerprint').notNull(),
    source: text('source', {
      enum: ['cli', 'console', 'daemon', 'desktop'],
    }).notNull(),
    level: text('level', {
      enum: ['error', 'fatal', 'info', 'warning'],
    })
      .default('error')
      .notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    route: text('route'),
    release: text('release'),
    frames: text('frames', { mode: 'json' })
      .$type<SentryFrame[]>()
      .default([])
      .notNull(),
    breadcrumbs: text('breadcrumbs', { mode: 'json' })
      .$type<SentryBreadcrumb[]>()
      .default([])
      .notNull(),
    tags: text('tags', { mode: 'json' })
      .$type<Record<string, string>>()
      .default({})
      .notNull(),
    count: integer('count').default(1).notNull(),
    resolved: integer('resolved', { mode: 'boolean' }).default(false).notNull(),
    firstSeenAt: text('first_seen_at').notNull(),
    lastSeenAt: text('last_seen_at').notNull(),
  },
  (table) => [
    index('idx_sentry_events_fingerprint').on(table.fingerprint),
    index('idx_sentry_events_triage').on(
      table.resolved,
      table.level,
      table.lastSeenAt,
    ),
  ],
);

export type CiRun = typeof ciRuns.$inferSelect;
export type NewCiRun = typeof ciRuns.$inferInsert;
export type SentryEvent = typeof sentryEvents.$inferSelect;
export type NewSentryEvent = typeof sentryEvents.$inferInsert;
