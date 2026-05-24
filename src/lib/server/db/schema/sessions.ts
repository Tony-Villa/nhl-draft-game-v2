import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const sessions = sqliteTable('session', {
	id: text('id').primaryKey().notNull(),
	token: text('token').notNull().unique(),

	userId: text('user_id')
		.notNull()
		.references(() => users.id, {
			onDelete: 'cascade'
		}),

	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});
