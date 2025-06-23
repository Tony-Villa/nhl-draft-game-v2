import { OAuth2RequestError } from 'arctic';
import { generateId } from 'lucia';
import { discord, lucia } from '$lib/server/auth';

import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import { games, users, keys, scores } from '$lib/server/db/schema';
import { createAndSetSession } from '$lib/server/authUtils';

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('discord_oauth_state') ?? null;

	console.log('[Discord OAuth] Starting callback process', {
		hasCode: !!code,
		hasState: !!state,
		hasStoredState: !!storedState,
		stateMatch: state === storedState,
		codeLength: code?.length || 0
	});

	if (!code || !state || !storedState || state !== storedState) {
		console.error('[Discord OAuth] Invalid OAuth parameters', {
			hasCode: !!code,
			hasState: !!state,
			hasStoredState: !!storedState,
			stateMatch: state === storedState,
			codeLength: code?.length || 0
		});
		return new Response('Invalid OAuth state or code verifier', {
			status: 400
		});
	}

	try {
		console.log('[Discord OAuth] Validating authorization code...');
		const tokens = await discord.validateAuthorizationCode(code);
		console.log('[Discord OAuth] Authorization code validated successfully');

		console.log('[Discord OAuth] Fetching user data from Discord API...');
		const discordUserResponse = await fetch("https://discord.com/api/users/@me", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		
		if (!discordUserResponse.ok) {
			console.error('[Discord OAuth] Failed to fetch user data from Discord API', {
				status: discordUserResponse.status,
				statusText: discordUserResponse.statusText
			});
			throw new Error(`Discord API error: ${discordUserResponse.status}`);
		}

		const discordUser: DiscordUser = await discordUserResponse.json();
		console.log('[Discord OAuth] Discord user data received', {
			userId: discordUser.id,
			email: discordUser.email ? `${discordUser.email.slice(0, 3)}***` : 'No email provided',
			emailDomain: discordUser.email?.split('@')[1] || 'unknown',
			username: discordUser.username,
			hasAvatar: !!discordUser.avatar
		});

		console.log('[Discord OAuth] Checking for existing user by email...');
		console.log('[Discord OAuth] Email exists:', !!discordUser.email);

		const [existingUser] = await db.select().from(users).where(eq(users.email, discordUser.email))

		if (existingUser) {
			console.log('[Discord OAuth] Existing user found', {
				userId: existingUser.id,
				emailDomain: existingUser.email?.split('@')[1] || 'unknown',
				keysCount: Array.isArray(existingUser.keys) ? existingUser.keys.length : 'unknown'
			});

			console.log('[Discord OAuth] Checking for existing Discord key...');
			const [existingKey] = await db
			.select()
			.from(keys)
			.where(
				and(
					eq(keys.providerId, 'discord'), 
					eq(keys.providerUserId, discordUser.id.toString())
					)
				);

			if(!existingKey) {
				console.log('[Discord OAuth] No existing Discord key found, linking account...');
				
				// Defensive validation for the keys array
				let safeKeys: string[] = [];
				try {
					if (Array.isArray(existingUser.keys)) {
						safeKeys = [...existingUser.keys];
					} else {
						console.warn('[Discord OAuth] Keys is not an array, using empty array');
						safeKeys = [];
					}
				} catch (e) {
					console.error('[Discord OAuth] Error processing keys, using empty array:', e);
					safeKeys = [];
				}
				
				// Only add discord if not already present
				if (!safeKeys.includes('discord')) {
					safeKeys.push('discord');
				}
				
				console.log('[Discord OAuth] Keys validation:', {
					originalKeysType: typeof existingUser.keys,
					originalKeysValue: existingUser.keys,
					safeKeysType: typeof safeKeys,
					safeKeysValue: safeKeys,
					safeKeysIsArray: Array.isArray(safeKeys),
					allElementsAreStrings: safeKeys.every(k => typeof k === 'string')
				});

				await db.transaction(async (trx) => {
					// link discord oauth account to the existing user
					await trx.insert(keys).values({
						providerId: 'discord',
						providerUserId: discordUser.id.toString(),
						userId: existingUser.id
					});

					console.log('[Discord OAuth] About to update keys with:', {
						keysValue: safeKeys,
						keysType: typeof safeKeys,
						isArray: Array.isArray(safeKeys)
					});

					// Update the user's keys list - THIS IS THE LINE THAT FAILS
					await trx.update(users).set({
						keys: safeKeys
					}).where(eq(users.id, existingUser.id));
				});
				
				console.log('[Discord OAuth] Successfully linked Discord account to existing user', {
					userId: existingUser.id,
					totalKeysCount: safeKeys.length
				});
			} else {
				console.log('[Discord OAuth] Existing Discord key found, user already linked');
			}

			console.log('[Discord OAuth] Creating session for existing user...');
			await createAndSetSession(lucia, existingUser.id, event.cookies);
			console.log('[Discord OAuth] Session created successfully for existing user');

		} else {
			console.log('[Discord OAuth] No existing user found, creating new user...');
			const userId = generateId(15);

			console.log('[Discord OAuth] Fetching default game...');
			const [defaultGame] = await db.select().from(games).where(eq(games.defaultGame, true))
			
			if (!defaultGame) {
				console.error('[Discord OAuth] No default game found in database');
				throw new Error('No default game configured');
			}

			console.log('[Discord OAuth] Creating new user with transaction...', {
				newUserId: userId,
				emailDomain: discordUser.email?.split('@')[1] || 'unknown',
				defaultGameId: defaultGame.id
			});

			await db.transaction(async (trx) => {
				await trx.insert(users).values({
					id: userId,
					email: discordUser.email,
					avatarUrl: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
					name: discordUser?.username || null,
					keys: ['discord']
				});

				await trx.insert(keys).values({
					providerId: 'discord',
					providerUserId: discordUser.id.toString(),
					userId
				});

				await trx.insert(scores).values({
					gameId: defaultGame.id,
					userId,
					score: 0
				})
			});

			console.log('[Discord OAuth] Successfully created new user and related records', {
				userId: userId,
				emailDomain: discordUser.email?.split('@')[1] || 'unknown'
			});

			console.log('[Discord OAuth] Creating session for new user...');
			await createAndSetSession(lucia, userId, event.cookies);
			console.log('[Discord OAuth] Session created successfully for new user');
		}

		console.log('[Discord OAuth] Login process completed successfully, redirecting to /draft-center');
		return new Response(null, {
			status: 302,
			headers: {
				Location: '/draft-center'
				}
			}
		);
		
	} catch (e) {
		console.error('[Discord OAuth] Authentication error occurred:', {
			error: e instanceof Error ? e.message : 'Unknown error',
			stack: e instanceof Error ? e.stack : undefined,
			type: e?.constructor?.name
		});
		
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			console.error('[Discord OAuth] OAuth2 request error - invalid code', {
				message: e.message,
				description: e.description
			});
			return new Response(null, {
				status: 400
			});
		}
		
		console.error('[Discord OAuth] Unexpected server error, returning 500');
		return new Response(null, {
			status: 500
		});
	}
}


interface DiscordUser {
	id: number;
	login: string;
	email: string;
	avatar: string;
	username: string;
}
