CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text,
	`title` text NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`label` text DEFAULT 'feature' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`assignee` text DEFAULT 'linh' NOT NULL,
	`favorite` integer DEFAULT false NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`workspace_id` text,
	`last_synced_at` text,
	`deleted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `browser_profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_profile` ON `tasks` (`profile_id`);--> statement-breakpoint
CREATE INDEX `idx_tasks_status` ON `tasks` (`status`);--> statement-breakpoint
CREATE INDEX `idx_tasks_workspace` ON `tasks` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `system_audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`details` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `system_plugins` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`settings` text DEFAULT '{}' NOT NULL,
	`installed_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_workspace_members_workspace` ON `workspace_members` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `idx_workspace_members_user` ON `workspace_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`tier` text DEFAULT 'free' NOT NULL,
	`max_profiles` integer DEFAULT 10 NOT NULL,
	`max_workflows` integer DEFAULT 50 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_workspaces_slug` ON `workspaces` (`slug`);--> statement-breakpoint
ALTER TABLE `jobs` ADD `task_id` text REFERENCES tasks(id);--> statement-breakpoint
CREATE INDEX `idx_jobs_task` ON `jobs` (`task_id`);