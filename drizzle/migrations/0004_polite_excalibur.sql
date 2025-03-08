CREATE TABLE `nhl_draft` (
	`id` integer PRIMARY KEY NOT NULL,
	`game_id` integer NOT NULL,
	`position_drafted` integer NOT NULL,
	`team` text NOT NULL,
	`prospect` text NOT NULL,
	`created_at` integer DEFAULT (cast (unixepoch() as int)) NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nhl_draft_id_unique` ON `nhl_draft` (`id`);