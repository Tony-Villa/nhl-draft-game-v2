import { sql } from 'drizzle-orm';

import { integer, sqliteTable, index, text, unique, blob } from 'drizzle-orm/sqlite-core';
import { games } from '.';

export const drafts = sqliteTable(
	'drafts',
	{
		id: integer('id').notNull().primaryKey().unique(),
		userId: text('user_id').notNull(),
		gameId: integer('game_id').notNull().references(() => games.id, {
			onDelete: 'cascade'
		}),
		positionDrafted: integer('position_drafted').notNull(),
		points: integer('points'),
		team: text('team').notNull(),
		prospect: blob('prospect').notNull(),
		createdAt: integer('created_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`)
	},
	(table) => {
		return {
			userIdIndex: index('drafts_user_id_index').on(table.userId),
			unq: unique().on(table.userId, table.positionDrafted)
		};
	}
);
 