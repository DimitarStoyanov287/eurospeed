CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`variant` integer NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`started_at` integer,
	`deadline` integer,
	`submitted_at` integer,
	`sql` text DEFAULT '' NOT NULL,
	`js` text DEFAULT '' NOT NULL,
	`answers` text DEFAULT '["","",""]' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`events` text DEFAULT '[]' NOT NULL,
	`history` text DEFAULT '[]' NOT NULL,
	`score_sql` integer,
	`score_js` integer,
	`score_explanation` integer,
	`notes` text DEFAULT '' NOT NULL,
	`revoked` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attempts_token_hash_unique` ON `attempts` (`token_hash`);