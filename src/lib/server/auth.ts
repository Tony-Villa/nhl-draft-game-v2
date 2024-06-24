import { Lucia } from 'lucia';
import { dev } from '$app/environment';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { users } from './db/schema/users';
import { sessions } from './db/schema/sessions';
import { Discord, Google } from 'arctic';
import { DISCORD_APP_ID, DISCORD_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BASE_URL } from '$env/static/private';

const adapter = new DrizzleSQLiteAdapter(db, sessions, users); // your adapter
const base_url = BASE_URL

const discordCallback = dev ? 'http://localhost:5173/auth/login/discord/callback' : 'https://hockeydraftshowdown.com/auth/login/discord/callback';
const googleCallback = dev ? 'http://localhost:5173/auth/login/google/callback' : 
'https://hockeydraftshowdown.com/auth/login/google/callback';


export const discord = new Discord(
	DISCORD_APP_ID,
	DISCORD_SECRET,
	discordCallback
);

export const googleOauth = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, googleCallback);

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
