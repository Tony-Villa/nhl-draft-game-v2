import { sql } from 'drizzle-orm';

import { integer, sqliteTable, index, text, unique, blob } from 'drizzle-orm/sqlite-core';
import { games, users, prospects } from '.';

export const drafts = sqliteTable(
	'drafts',
	{
		id: integer('id').notNull().primaryKey().unique(),
		userId: text('user_id').notNull().references(() => users.id,),
		gameId: text('game_id').notNull().references(() => games.id, {
			onDelete: 'cascade'
		}),
		positionDrafted: integer('position_drafted').notNull(),
		points: integer('points'),
		team: text('team').notNull(),
		prospectId: text('prospect_id').references(() => prospects.id),
		createdAt: integer('created_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`)
	},
	(table) => {
		return {
			userIdIndex: index('drafts_user_id_index').on(table.userId),
			// Performance indexes for draft insights queries
			gamePositionIndex: index('drafts_game_position_index').on(table.gameId, table.positionDrafted),
			gameProspectIndex: index('drafts_game_prospect_index').on(table.gameId, table.prospectId),
			prospectPositionIndex: index('drafts_prospect_position_index').on(table.prospectId, table.positionDrafted),
			unq: unique().on(table.userId, table.positionDrafted, table.gameId)
		};
	}
);
 