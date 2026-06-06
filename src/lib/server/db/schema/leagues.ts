import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { games, users } from '.';

export const leagues = sqliteTable(
	'leagues',
	{
		id: integer('id').notNull().primaryKey().unique(),
		gameId: text('game_id')
			.notNull()
			.references(() => games.id, {
				onDelete: 'cascade'
			}),
		ownerUserId: text('owner_user_id')
			.notNull()
			.references(() => users.id, {
				onDelete: 'cascade'
			}),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		inviteCode: text('invite_code').notNull(),
		description: text('description'),
		status: text('status').notNull().default('active'),
		createdAt: integer('created_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`),
		updatedAt: integer('updated_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`)
	},
	(table) => {
		return {
			gameIndex: index('leagues_game_index').on(table.gameId),
			ownerIndex: index('leagues_owner_index').on(table.ownerUserId),
			slugUnique: unique().on(table.slug),
			inviteCodeUnique: unique().on(table.inviteCode)
		};
	}
);

export type LeagueSchema = typeof leagues.$inferSelect;
export type NewLeagueSchema = typeof leagues.$inferInsert;
