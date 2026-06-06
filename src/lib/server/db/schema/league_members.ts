import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { draftBoards, leagues, users } from '.';

export const leagueMembers = sqliteTable(
	'league_members',
	{
		leagueId: integer('league_id')
			.notNull()
			.references(() => leagues.id, {
				onDelete: 'cascade'
			}),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, {
				onDelete: 'cascade'
			}),
		selectedDraftBoardId: integer('selected_draft_board_id')
			.notNull()
			.references(() => draftBoards.id, {
				onDelete: 'cascade'
			}),
		role: text('role').notNull().default('member'),
		joinedAt: integer('joined_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`),
		updatedAt: integer('updated_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`)
	},
	(table) => {
		return {
			userIndex: index('league_members_user_index').on(table.userId),
			boardIndex: index('league_members_board_index').on(table.selectedDraftBoardId),
			leagueUserUnique: unique().on(table.leagueId, table.userId)
		};
	}
);

export type LeagueMemberSchema = typeof leagueMembers.$inferSelect;
export type NewLeagueMemberSchema = typeof leagueMembers.$inferInsert;
