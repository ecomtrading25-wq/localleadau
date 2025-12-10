CREATE TABLE `agencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`logoUrl` varchar(500),
	`primaryColor` varchar(7),
	`secondaryColor` varchar(7),
	`domain` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `agencies_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `billing_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`priceMonthly` int NOT NULL,
	`priceAnnual` int NOT NULL,
	`maxNiches` int NOT NULL DEFAULT 1,
	`maxRegions` int NOT NULL DEFAULT 1,
	`maxLeadsPerMonth` int NOT NULL DEFAULT 15,
	`features` text,
	`stripePriceIdMonthly` varchar(255),
	`stripePriceIdAnnual` varchar(255),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `billing_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `billing_plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `campaign_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`prospectId` int,
	`leadId` int,
	`status` enum('pending','active','completed','unsubscribed') NOT NULL DEFAULT 'pending',
	`currentStep` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaign_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaign_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`channel` enum('email','sms') NOT NULL,
	`delayDays` int NOT NULL DEFAULT 0,
	`subject` varchar(500),
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaign_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('draft','active','paused','completed') NOT NULL DEFAULT 'draft',
	`isTemplate` boolean NOT NULL DEFAULT false,
	`templateCategory` varchar(100),
	`totalRecipients` int NOT NULL DEFAULT 0,
	`totalSent` int NOT NULL DEFAULT 0,
	`totalOpened` int NOT NULL DEFAULT 0,
	`totalReplied` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`organisationId` int,
	`type` enum('idea','bug','question','nps') NOT NULL,
	`rating` int,
	`message` text,
	`pagePath` varchar(500),
	`status` enum('new','reviewed','resolved') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `help_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` varchar(500) NOT NULL,
	`category` varchar(100) NOT NULL,
	`body` text NOT NULL,
	`published` boolean NOT NULL DEFAULT true,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `help_articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `help_articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`userId` int,
	`type` enum('note','email','call','meeting','status_change') NOT NULL,
	`content` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`contactName` varchar(255),
	`email` varchar(320),
	`phone` varchar(50),
	`address` text,
	`website` varchar(500),
	`status` enum('new','contacted','qualified','proposal','won','lost') NOT NULL DEFAULT 'new',
	`source` varchar(100),
	`sourceId` int,
	`estimatedValue` int,
	`actualValue` int,
	`assignedToUserId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organisations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`website` varchar(500),
	`industry` varchar(100),
	`abn` varchar(20),
	`city` varchar(100),
	`state` varchar(50),
	`radius` int,
	`suburbs` text,
	`averageJobValue` int,
	`closeRate` int,
	`monthlyFee` int,
	`leadHandlingEmail` varchar(320),
	`leadHandlingSms` varchar(20),
	`agencyId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organisations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organisations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `prospect_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`prospectIds` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prospect_lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prospect_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`niche` varchar(100),
	`location` varchar(255),
	`searchQuery` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prospect_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prospects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`address` text,
	`city` varchar(100),
	`state` varchar(50),
	`postcode` varchar(10),
	`phone` varchar(50),
	`email` varchar(320),
	`website` varchar(500),
	`placeId` varchar(255),
	`latitude` varchar(50),
	`longitude` varchar(50),
	`rating` varchar(10),
	`reviewCount` int,
	`category` varchar(255),
	`enriched` boolean NOT NULL DEFAULT false,
	`enrichedAt` timestamp,
	`status` enum('unqualified','qualified','excluded','converted') NOT NULL DEFAULT 'unqualified',
	`sourceId` int,
	`scrapeJobId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prospects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pseo_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`city` varchar(100) NOT NULL,
	`state` varchar(50) NOT NULL,
	`regionLabel` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pseo_locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `pseo_locations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `pseo_niches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`label` varchar(255) NOT NULL,
	`pluralLabel` varchar(255) NOT NULL,
	`category` varchar(100),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pseo_niches_id` PRIMARY KEY(`id`),
	CONSTRAINT `pseo_niches_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `pseo_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nicheId` int NOT NULL,
	`locationId` int NOT NULL,
	`path` varchar(500) NOT NULL,
	`title` varchar(255) NOT NULL,
	`metaDescription` text,
	`heroOverride` text,
	`contentOverride` text,
	`published` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pseo_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `pseo_pages_path_unique` UNIQUE(`path`)
);
--> statement-breakpoint
CREATE TABLE `scrape_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`sourceId` int NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`searchQuery` text NOT NULL,
	`location` varchar(255) NOT NULL,
	`maxResults` int NOT NULL DEFAULT 100,
	`prospectsFound` int NOT NULL DEFAULT 0,
	`prospectsCreated` int NOT NULL DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scrape_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('trialing','active','past_due','canceled','unpaid') NOT NULL DEFAULT 'trialing',
	`billingPeriod` enum('monthly','annual') NOT NULL DEFAULT 'monthly',
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`trialEndsAt` timestamp,
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`canceledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_organisations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`organisationId` int NOT NULL,
	`role` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_organisations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','superadmin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `onboarded` boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `campaign_recipients` (`campaignId`);--> statement-breakpoint
CREATE INDEX `prospect_idx` ON `campaign_recipients` (`prospectId`);--> statement-breakpoint
CREATE INDEX `lead_idx` ON `campaign_recipients` (`leadId`);--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `campaign_steps` (`campaignId`);--> statement-breakpoint
CREATE INDEX `org_idx` ON `campaigns` (`organisationId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `campaigns` (`status`);--> statement-breakpoint
CREATE INDEX `template_idx` ON `campaigns` (`isTemplate`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `feedback` (`userId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `feedback` (`type`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `help_articles` (`category`);--> statement-breakpoint
CREATE INDEX `lead_idx` ON `interactions` (`leadId`);--> statement-breakpoint
CREATE INDEX `org_idx` ON `leads` (`organisationId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `assigned_idx` ON `leads` (`assignedToUserId`);--> statement-breakpoint
CREATE INDEX `agency_idx` ON `organisations` (`agencyId`);--> statement-breakpoint
CREATE INDEX `org_idx` ON `prospect_lists` (`organisationId`);--> statement-breakpoint
CREATE INDEX `org_idx` ON `prospect_sources` (`organisationId`);--> statement-breakpoint
CREATE INDEX `org_idx` ON `prospects` (`organisationId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `prospects` (`status`);--> statement-breakpoint
CREATE INDEX `source_idx` ON `prospects` (`sourceId`);--> statement-breakpoint
CREATE INDEX `niche_idx` ON `pseo_pages` (`nicheId`);--> statement-breakpoint
CREATE INDEX `location_idx` ON `pseo_pages` (`locationId`);--> statement-breakpoint
CREATE INDEX `org_idx` ON `scrape_jobs` (`organisationId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `scrape_jobs` (`status`);--> statement-breakpoint
CREATE INDEX `org_idx` ON `subscriptions` (`organisationId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `subscriptions` (`status`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_organisations` (`userId`);--> statement-breakpoint
CREATE INDEX `org_idx` ON `user_organisations` (`organisationId`);