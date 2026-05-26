import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { games, users } from '.';

export const draftBoards = sqliteTable(
	'draft_boards',
	{
		id: integer('id').notNull().primaryKey().unique(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, {
				onDelete: 'cascade'
			}),
		gameId: text('game_id')
			.notNull()
			.references(() => games.id, {
				onDelete: 'cascade'
			}),
		name: text('name').notNull().default('My Draft Board'),
		status: text('status').notNull().default('draft'),
		isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
		createdAt: integer('created_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`),
		updatedAt: integer('updated_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`),
		submittedAt: integer('submitted_at')
	},
	(table) => {
		return {
			userGameIndex: index('draft_boards_user_game_index').on(table.userId, table.gameId),
			userGameDefaultIndex: index('draft_boards_user_game_default_index').on(
				table.userId,
				table.gameId,
				table.isDefault
			),
			userGameNameUnique: unique().on(table.userId, table.gameId, table.name)
		};
	}
);

export type DraftBoardSchema = typeof draftBoards.$inferSelect;
export type NewDraftBoardSchema = typeof draftBoards.$inferInsert;
