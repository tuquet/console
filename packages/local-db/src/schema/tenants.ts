import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// 1. Workspaces (Cached Multi-Tenant Workspaces)
export const workspaces = sqliteTable(
  'workspaces',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    tier: text('tier', { enum: ['free', 'pro', 'enterprise'] })
      .default('free')
      .notNull(),
    maxProfiles: integer('max_profiles').default(10).notNull(),
    maxWorkflows: integer('max_workflows').default(50).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('idx_workspaces_slug').on(table.slug)],
);

// 2. Workspace Members (Local membership cache)
export const workspaceMembers = sqliteTable(
  'workspace_members',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    email: text('email').notNull(),
    role: text('role', { enum: ['owner', 'admin', 'member', 'viewer'] })
      .default('member')
      .notNull(),
    joinedAt: text('joined_at').notNull(),
  },
  (table) => [
    index('idx_workspace_members_workspace').on(table.workspaceId),
    index('idx_workspace_members_user').on(table.userId),
  ],
);

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;
