ALTER TABLE `campaign_recipients` MODIFY COLUMN `status` enum('pending','active','completed','unsubscribed','failed') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `campaign_recipients` ADD `lastSentAt` timestamp;--> statement-breakpoint
ALTER TABLE `campaign_recipients` ADD `completedAt` timestamp;