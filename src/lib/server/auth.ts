import { Lucia } from 'lucia';
import { dev } from '$app/environment';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { users } from './db/schema/users';
import { sessions } from './db/schema/sessions';
import { Discord } from 'arctic';
import { DISCORD_APP_ID, DISCORD_PUBLIC_KEY } from '$env/static/private';

const adapter = new DrizzleSQLiteAdapter(db, sessions, users); // your adapter

export const discord = new Discord(
	DISCORD_APP_ID,
	DISCORD_PUBLIC_KEY,
	'http://localhost:5173/draft-center'
);

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
			email: attributes?.email,
			keys: attributes?.keys,
			avatarUrl: attributes?.avatarUrl,
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
	email: string;
	keys: string[];
	avatarUrl: string;
};
