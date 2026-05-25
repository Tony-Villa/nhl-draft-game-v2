import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const accounts = sqliteTable(
	'account',
	{
		id: text('id').primaryKey().notNull(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, {
				onDelete: 'cascade'
			}),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
		refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
		scope: text('scope'),
		password: text('password'),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(cast (unixepoch() as int))`),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(cast (unixepoch() as int))`)
	},
	(table) => {
		return {
			providerAccountUnique: uniqueIndex('account_provider_account_unique').on(
				table.providerId,
				table.accountId
			)
		};
	}
);

export type AccountSchema = typeof accounts.$inferInsert;
