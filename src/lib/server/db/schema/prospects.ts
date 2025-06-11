import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, index, unique } from 'drizzle-orm/sqlite-core';
import { games } from '.';

export const prospects = sqliteTable(
	'prospects',
	{
		id: integer('id').notNull().primaryKey().unique(),
		rank: text('rank').notNull(),
		name: text('name').notNull(),
		position: text('position'),
		nation: text('nation'),
		team: text('team').notNull(),
		league: text('league').notNull(),
		birthDay: text('birth_day').notNull(),
		height: text('height').notNull(),
		weight: text('weight').notNull(),
		shoots: text('shoots').notNull(),
    draftYear: integer('draft_year').notNull(),
		createdAt: integer('created_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`),
		updatedAt: integer('updated_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`)
	},
	(table) => {
		return {
			rankGameIndex: index('prospects_name_year_index').on(table.name, table.draftYear),
			unq: unique().on(table.name,)
		};
	}
);

export type ProspectSchema = typeof prospects.$inferSelect;
export type NewProspectSchema = typeof prospects.$inferInsert;
