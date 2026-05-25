import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { draftBoards, prospects } from '.';

export const draftBoardPicks = sqliteTable(
	'draft_board_picks',
	{
		id: integer('id').notNull().primaryKey().unique(),
		draftBoardId: integer('draft_board_id')
			.notNull()
			.references(() => draftBoards.id, {
				onDelete: 'cascade'
			}),
		positionDrafted: integer('position_drafted').notNull(),
		points: integer('points'),
		team: text('team').notNull(),
		prospectId: text('prospect_id').references(() => prospects.id, {
			onUpdate: 'cascade',
			onDelete: 'no action'
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
			boardIndex: index('draft_board_picks_board_index').on(table.draftBoardId),
			boardProspectIndex: index('draft_board_picks_board_prospect_index').on(
				table.draftBoardId,
				table.prospectId
			),
			prospectPositionIndex: index('draft_board_picks_prospect_position_index').on(
				table.prospectId,
				table.positionDrafted
			),
			boardPositionUnique: unique().on(table.draftBoardId, table.positionDrafted)
		};
	}
);

export type DraftBoardPickSchema = typeof draftBoardPicks.$inferSelect;
export type NewDraftBoardPickSchema = typeof draftBoardPicks.$inferInsert;
