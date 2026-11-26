CREATE TABLE `ci_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`suite` text NOT NULL,
	`status` text NOT NULL,
	`git_ref` text DEFAULT '' NOT NULL,
	`total_seconds` real,
	`error_count` integer DEFAULT 0 NOT NULL,
	`warn_count` integer DEFAULT 0 NOT NULL,
	`line_count` integer DEFAULT 0 NOT NULL,
	`summary_lines` text DEFAULT '[]' NOT NULL,
	`steps` text DEFAULT '[]' NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_ci_runs_suite_started` ON `ci_runs` (`suite`,`started_at`);--> statement-breakpoint
CREATE TABLE `sentry_events` (
	`id` text PRIMARY KEY NOT NULL,
	`fingerprint` text NOT NULL,
	`source` text NOT NULL,
	`level` text DEFAULT 'error' NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`route` text,
	`release` text,
	`frames` text DEFAULT '[]' NOT NULL,
	`breadcrumbs` text DEFAULT '[]' NOT NULL,
	`tags` text DEFAULT '{}' NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`resolved` integer DEFAULT false NOT NULL,
	`first_seen_at` text NOT NULL,
	`last_seen_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sentry_events_fingerprint` ON `sentry_events` (`fingerprint`);--> statement-breakpoint
CREATE INDEX `idx_sentry_events_triage` ON `sentry_events` (`resolved`,`level`,`last_seen_at`);