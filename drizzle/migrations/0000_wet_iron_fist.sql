CREATE TABLE `drafts` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`game_id` integer NOT NULL,
	`position_drafted` integer NOT NULL,
	`team` text NOT NULL,
	`prospect` blob,
	`created_at` integer DEFAULT (cast (unixepoch() as int)) NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `game` (
	`id` text PRIMARY KEY NOT NULL,
	`year` text NOT NULL,
	`lock_date` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`game_phase` text DEFAULT 'open' NOT NULL,
	`default_game` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`avatar_url` text,
	`email` text NOT NULL,
	`password` text,
	`keys` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `key` (
	`user_id` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`provider_id` text NOT NULL,
	PRIMARY KEY(`provider_id`, `provider_user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `score` (
	`user_id` text NOT NULL,
	`game_id` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `drafts_id_unique` ON `drafts` (`id`);--> statement-breakpoint
CREATE INDEX `drafts_user_id_index` ON `drafts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `drafts_user_id_position_drafted_unique` ON `drafts` (`user_id`,`position_drafted`);--> statement-breakpoint
CREATE UNIQUE INDEX `game_id_unique` ON `game` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);