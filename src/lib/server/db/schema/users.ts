import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('user', {
	id: text('id').notNull().primaryKey(),
	name: text('name'),
	avatarUrl: text('avatar_url'),
	email: text('email').notNull(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
	password: text('password'),
	keys: text('keys', {mode: 'json'}).$type<string[]>().notNull(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(cast (unixepoch() as int))`)
}, (table) => {
	return {
		emailUnique: uniqueIndex('user_email_unique').on(table.email)
	};
});

export type UserSchema = typeof users.$inferInsert;
