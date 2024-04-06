import { OAuth2RequestError } from 'arctic';
import { and, eq } from 'drizzle-orm';
import { generateId } from 'lucia';

import {
	GOOGLE_OAUTH_CODE_VERIFIER_COOKIE_NAME,
	GOOGLE_OAUTH_STATE_COOKIE_NAME,
	createAndSetSession
} from '$lib/server/authUtils';
import { db } from '$lib/server/db';
import { googleOauth, lucia } from '$lib/server/auth';
import { users, keys } from '$lib/server/db/schema';
import type { RequestEvent } from '../../$types';

type GoogleUser = {
	sub: string;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	email: string;
	email_verified: boolean;
	locale: string;
};

export const GET = async (event : RequestEvent) => {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');

	const storedState = event.cookies.get(GOOGLE_OAUTH_STATE_COOKIE_NAME);
	const storedCodeVerifier = event.cookies.get(GOOGLE_OAUTH_CODE_VERIFIER_COOKIE_NAME);

	// Validate OAuth state and code verifier
	if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
		return new Response('Invalid OAuth state or code verifier', {
			status: 400
		});
	}

	try {
		const tokens = await googleOauth.validateAuthorizationCode(code, storedCodeVerifier);

		const googleUserResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});

		const googleUser = (await googleUserResponse.json()) as GoogleUser;

		if (!googleUser.email) {
			return new Response('No primary email address', {
				status: 400
			});
		}

		if (!googleUser.email_verified) {
			return new Response('Unverified email', {
				status: 400
			});
		}

		// Check if the user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, googleUser.email))

		if (existingUser) {
			// Check if the user already has a Google OAuth account linked
			const [existingKey] = await db
			.select()
			.from(keys)
			.where(
				and(
					eq(keys.providerId, 'google'), 
					eq(keys.providerUserId, googleUser.sub)
					)
				);

			if (!existingKey) {
				// Add the 'google' auth provider to the user's authMethods list
				const authKeys = existingUser.keys || [];
				authKeys.push('google');

				await db.transaction(async (trx) => {
					// link discord oauth account to the existing user
					await trx.insert(keys).values({
						providerId: 'google',
						providerUserId: googleUser.sub,
						userId: existingUser.id
					});

					// Update the user's keys list
					await trx.update(users).set({
						keys: authKeys
					}).where(eq(users.id, existingUser.id));
				});
			}

			await createAndSetSession(lucia, existingUser.id, event.cookies);
		} else {
			// Create a new user and their OAuth account
			const userId = generateId(15);

			await db.transaction(async (trx) => {
        await trx.insert(users).values({
					id: userId,
					email: googleUser.email,
					avatarUrl: googleUser.picture,
					name: googleUser.name,
					keys: ['google']
				});

				await trx.insert(keys).values({
					userId,
					providerId: 'google',
					providerUserId: googleUser.sub
				});
			});

			await createAndSetSession(lucia, userId, event.cookies);
		}

		return new Response(null, {
			status: 302,
			headers: {
				Location: '/draft-center'
				}
		});
	} catch (error) {
		console.error(error);

		// the specific error message depends on the provider
		if (error instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}

		return new Response(null, {
			status: 500
		});
	}
};