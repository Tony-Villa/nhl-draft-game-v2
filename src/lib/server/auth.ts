import { dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { betterAuth, generateId } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { db } from './db';
import * as schema from './db/schema';
import { Discord, Google } from 'arctic';
import {
	BETTER_AUTH_SECRET,
	DISCORD_APP_ID,
	DISCORD_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET
} from '$env/static/private';

const baseURL = dev ? 'http://localhost:5173' : 'https://hockeydraftshowdown.com';
const discordCallback = `${baseURL}/auth/login/discord/callback`;
const googleCallback = `${baseURL}/auth/login/google/callback`;

const betterAuthSchema = {
	...schema,
	user: schema.users,
	session: schema.sessions,
	account: schema.accounts,
	verification: schema.verifications
};

export const auth = betterAuth({
	appName: 'Hockey Draft Showdown',
	baseURL,
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: 'sqlite',
		schema: betterAuthSchema
	}),
	socialProviders: {
		google: {
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET
		},
		discord: {
			clientId: DISCORD_APP_ID,
			clientSecret: DISCORD_SECRET,
			mapProfileToUser: (profile) => ({
				email:
					profile.email ??
					`discord-temp-${profile.id}@temp.nhl-draft-game.local`,
				emailVerified: Boolean(profile.email && profile.verified),
				image: profile.image_url
			})
		}
	},
	user: {
		fields: {
			image: 'avatarUrl'
		}
	},
	account: {
		accountLinking: {
			trustedProviders: ['google', 'discord'],
			requireLocalEmailVerified: false
		}
	},
	advanced: {
		useSecureCookies: !dev,
		database: {
			generateId: ({ model, size }) => generateId(model === 'user' ? 15 : size)
		}
	},
	plugins: [sveltekitCookies(getRequestEvent)]
});

export const discord = new Discord(DISCORD_APP_ID, DISCORD_SECRET, discordCallback);
export const googleOauth = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, googleCallback);
