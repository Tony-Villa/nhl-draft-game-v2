import { sql } from 'drizzle-orm';
import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('user', {
	id: text('id').notNull().primaryKey(),
	name: text('name'),
	avatarUrl: text('avatar_url'),
	email: text('email').notNull(),
	password: text('password'),
	keys: text('keys', {mode: 'json'}).$type<string[]>().notNull(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => {
	return {
		emailUnique: uniqueIndex('user_email_unique').on(table.email)
	};
});

export type UserSchema = typeof users.$inferInsert;
