ALTER TABLE `browser_profiles` ADD `workspace_id` text;--> statement-breakpoint
ALTER TABLE `browser_profiles` ADD `deleted_at` text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_browser_profiles_workspace` ON `browser_profiles` (`workspace_id`);--> statement-breakpoint
ALTER TABLE `proxies` ADD `workspace_id` text;--> statement-breakpoint
ALTER TABLE `proxies` ADD `deleted_at` text;--> statement-breakpoint
ALTER TABLE `proxies` ADD `updated_at` text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_proxies_workspace` ON `proxies` (`workspace_id`);--> statement-breakpoint
ALTER TABLE `workflows` ADD `workspace_id` text;--> statement-breakpoint
ALTER TABLE `workflows` ADD `deleted_at` text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_workflows_workspace` ON `workflows` (`workspace_id`);
