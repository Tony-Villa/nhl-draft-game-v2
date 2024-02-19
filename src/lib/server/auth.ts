import { Lucia } from 'lucia';
import { dev } from '$app/environment';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { users } from './db/schema/users';
import { sessions } from './db/schema/sessions';

const adapter = new DrizzleSQLiteAdapter(db, sessions, users); // your adapter

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: !dev
		}
	},

	getUserAttributes: (attributes) => {
		return {
			name: attributes?.name,
			username: attributes?.username
			// email: attributes?.email
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

export type DatabaseUserAttributes = {
	name: string;
	username: string;
	// email: string;
};
