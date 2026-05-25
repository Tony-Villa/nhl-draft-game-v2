import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { draftBoards, games, users } from '.';

export const gameEntries = sqliteTable(
	'game_entries',
	{
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
		selectedDraftBoardId: integer('selected_draft_board_id')
			.notNull()
			.references(() => draftBoards.id, {
				onDelete: 'cascade'
			}),
		createdAt: integer('created_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`),
		updatedAt: integer('updated_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`)
	},
	(table) => {
		return {
			gameIndex: index('game_entries_game_index').on(table.gameId),
			boardIndex: index('game_entries_board_index').on(table.selectedDraftBoardId),
			userGameUnique: unique().on(table.userId, table.gameId)
		};
	}
);

export type GameEntrySchema = typeof gameEntries.$inferSelect;
export type NewGameEntrySchema = typeof gameEntries.$inferInsert;
