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
import { users, keys, games, scores } from '$lib/server/db/schema';
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

	console.log('[Google OAuth] Starting callback process', {
		hasCode: !!code,
		hasState: !!state,
		hasStoredState: !!storedState,
		hasCodeVerifier: !!storedCodeVerifier,
		stateMatch: state === storedState,
		codeLength: code?.length || 0
	});

	// Validate OAuth state and code verifier
	if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
		console.error('[Google OAuth] Invalid OAuth parameters', {
			hasCode: !!code,
			hasState: !!state,
			hasStoredState: !!storedState,
			hasCodeVerifier: !!storedCodeVerifier,
			stateMatch: state === storedState,
			codeLength: code?.length || 0
		});
		return new Response('Invalid OAuth state or code verifier', {
			status: 400
		});
	}

	try {
		console.log('[Google OAuth] Validating authorization code...');
		const tokens = await googleOauth.validateAuthorizationCode(code, storedCodeVerifier);
		console.log('[Google OAuth] Authorization code validated successfully');

		console.log('[Google OAuth] Fetching user data from Google API...');
		const googleUserResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});

		if (!googleUserResponse.ok) {
			console.error('[Google OAuth] Failed to fetch user data from Google API', {
				status: googleUserResponse.status,
				statusText: googleUserResponse.statusText
			});
			throw new Error(`Google API error: ${googleUserResponse.status}`);
		}

		const googleUser = (await googleUserResponse.json()) as GoogleUser;
		console.log('[Google OAuth] Google user data received', {
			sub: googleUser.sub,
			emailDomain: googleUser.email?.split('@')[1] || 'unknown',
			name: googleUser.name,
			emailVerified: googleUser.email_verified,
			hasPicture: !!googleUser.picture
		});

		if (!googleUser.email) {
			console.error('[Google OAuth] No email address provided by Google');
			return new Response('No primary email address', {
				status: 400
			});
		}

		if (!googleUser.email_verified) {
			console.error('[Google OAuth] Email not verified by Google', {
				emailDomain: googleUser.email?.split('@')[1] || 'unknown'
			});
			return new Response('Unverified email', {
				status: 400
			});
		}

		console.log('[Google OAuth] Checking for existing user by email...');
		// Check if the user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, googleUser.email))

		if (existingUser) {
			console.log('[Google OAuth] Existing user found', {
				userId: existingUser.id,
				emailDomain: existingUser.email?.split('@')[1] || 'unknown',
				keysCount: Array.isArray(existingUser.keys) ? existingUser.keys.length : 'unknown'
			});

			console.log('[Google OAuth] Checking for existing Google key...');
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
				console.log('[Google OAuth] No existing Google key found, linking account...');
				// Add the 'google' auth provider to the user's authMethods list
				const authKeys = existingUser.keys || [];
				authKeys.push('google');

				await db.transaction(async (trx) => {
					// link google oauth account to the existing user
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
				
				console.log('[Google OAuth] Successfully linked Google account to existing user', {
					userId: existingUser.id,
					totalKeysCount: authKeys.length
				});
			} else {
				console.log('[Google OAuth] Existing Google key found, user already linked');
			}

			console.log('[Google OAuth] Creating session for existing user...');
			await createAndSetSession(lucia, existingUser.id, event.cookies);
			console.log('[Google OAuth] Session created successfully for existing user');
		} else {
			console.log('[Google OAuth] No existing user found, creating new user...');
			// Create a new user and their OAuth account
			const userId = generateId(15);

			console.log('[Google OAuth] Fetching default game...');
			const [defaultGame] = await db.select().from(games).where(eq(games.defaultGame, true))
			
			if (!defaultGame) {
				console.error('[Google OAuth] No default game found in database');
				throw new Error('No default game configured');
			}

			console.log('[Google OAuth] Creating new user with transaction...', {
				newUserId: userId,
				emailDomain: googleUser.email?.split('@')[1] || 'unknown',
				defaultGameId: defaultGame.id
			});

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

				await trx.insert(scores).values({
					gameId: defaultGame.id,
					userId,
					score: 0
				})
			});

			console.log('[Google OAuth] Successfully created new user and related records', {
				userId: userId,
				emailDomain: googleUser.email?.split('@')[1] || 'unknown'
			});

			console.log('[Google OAuth] Creating session for new user...');
			await createAndSetSession(lucia, userId, event.cookies);
			console.log('[Google OAuth] Session created successfully for new user');
		}

		console.log('[Google OAuth] Login process completed successfully, redirecting to /draft-center');
		return new Response(null, {
			status: 302,
			headers: {
				Location: '/draft-center'
				}
		});
	} catch (error) {
		console.error('[Google OAuth] Authentication error occurred:', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			type: error?.constructor?.name
		});

		// the specific error message depends on the provider
		if (error instanceof OAuth2RequestError) {
			console.error('[Google OAuth] OAuth2 request error - invalid code', {
				message: error.message,
				description: error.description
			});
			return new Response(null, {
				status: 400
			});
		}

		console.error('[Google OAuth] Unexpected server error, returning 500');
		return new Response(null, {
			status: 500
		});
	}
};