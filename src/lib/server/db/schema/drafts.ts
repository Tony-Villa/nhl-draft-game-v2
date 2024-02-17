import { sql } from 'drizzle-orm';

import { integer, sqliteTable, blob, index, text } from 'drizzle-orm/sqlite-core';

export const drafts = sqliteTable(
	'drafts',
	{
		id: integer('id').notNull().primaryKey().unique(),
		userId: text('user_id').notNull(),
		positionDrafted: integer('position_drafted').notNull(),
		prospect: blob('prospect').notNull(),
		createdAt: integer('created_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`)
	},
	(table) => {
		return {
			userIdIndex: index('drafts_user_id_index').on(table.userId)
		};
	}
);
