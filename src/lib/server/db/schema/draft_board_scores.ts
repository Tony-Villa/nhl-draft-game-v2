import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { draftBoards, games } from '.';

export const draftBoardScores = sqliteTable(
	'draft_board_scores',
	{
		draftBoardId: integer('draft_board_id')
			.notNull()
			.references(() => draftBoards.id, {
				onDelete: 'cascade'
			}),
		gameId: text('game_id')
			.notNull()
			.references(() => games.id, {
				onDelete: 'cascade'
			}),
		score: integer('score').notNull().default(0),
		createdAt: integer('created_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`),
		updatedAt: integer('updated_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`)
	},
	(table) => {
		return {
			gameScoreIndex: index('draft_board_scores_game_score_index').on(table.gameId, table.score),
			boardGameUnique: unique().on(table.draftBoardId, table.gameId)
		};
	}
);

export type DraftBoardScoreSchema = typeof draftBoardScores.$inferSelect;
export type NewDraftBoardScoreSchema = typeof draftBoardScores.$inferInsert;
