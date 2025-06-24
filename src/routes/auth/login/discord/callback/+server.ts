import { OAuth2RequestError } from 'arctic';
import { generateId } from 'lucia';
import { discord, lucia } from '$lib/server/auth';

import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { and, eq, desc, count } from 'drizzle-orm';
import { games, users, keys, scores, drafts } from '$lib/server/db/schema';
import { createAndSetSession } from '$lib/server/authUtils';

// Constants for Discord temp email handling
const DISCORD_TEMP_EMAIL_PREFIX = 'discord-temp-';

// Helper function to create temp email for Discord users without email
function createTempDiscordEmail(discordUserId: string): string {
	return `${DISCORD_TEMP_EMAIL_PREFIX}${discordUserId}@temp.nhl-draft-game.local`;
}

// Helper function to check if an email is a Discord temp email
function isDiscordTempEmail(email: string): boolean {
	return email.startsWith(DISCORD_TEMP_EMAIL_PREFIX) && email.endsWith('@temp.nhl-draft-game.local');
}

// Helper function to extract Discord user ID from temp email
function extractDiscordIdFromTempEmail(email: string): string | null {
	if (!isDiscordTempEmail(email)) return null;
	return email.replace(DISCORD_TEMP_EMAIL_PREFIX, '').replace('@temp.nhl-draft-game.local', '');
}

// Helper function to merge two user accounts, prioritizing drafts based on your rules
async function mergeUserAccounts(keepUserId: string, mergeUserId: string, gameId: string): Promise<void> {
	console.log('[Discord OAuth] Starting account merge process', {
		keepUserId,
		mergeUserId,
		gameId
	});

	// Get draft counts for both users in the current game
	const [keepUserDrafts] = await db
		.select({ count: count() })
		.from(drafts)
		.where(and(eq(drafts.userId, keepUserId), eq(drafts.gameId, gameId)));

	const [mergeUserDrafts] = await db
		.select({ count: count() })
		.from(drafts)
		.where(and(eq(drafts.userId, mergeUserId), eq(drafts.gameId, gameId)));

	const keepUserDraftCount = keepUserDrafts?.count || 0;
	const mergeUserDraftCount = mergeUserDrafts?.count || 0;

	console.log('[Discord OAuth] Draft counts for merge decision', {
		keepUserDraftCount,
		mergeUserDraftCount
	});

	// Determine which user's drafts to keep based on your rules
	let finalUserId = keepUserId;
	
	if (keepUserDraftCount === 0 && mergeUserDraftCount > 0) {
		// Keep user has no drafts, merge user has drafts -> use merge user's drafts
		console.log('[Discord OAuth] Keep user has no drafts, using merge user drafts');
		finalUserId = mergeUserId;
	} else if (keepUserDraftCount > 0 && mergeUserDraftCount > 0) {
		// Both have drafts, use the one with more positions drafted
		if (mergeUserDraftCount > keepUserDraftCount) {
			console.log('[Discord OAuth] Merge user has more draft positions, using merge user drafts');
			finalUserId = mergeUserId;
		} else if (mergeUserDraftCount === keepUserDraftCount && keepUserDraftCount === 32) {
			// Both have all 32 picks, use the one drafted most recently
			const [keepUserLatest] = await db
				.select({ createdAt: drafts.createdAt })
				.from(drafts)
				.where(and(eq(drafts.userId, keepUserId), eq(drafts.gameId, gameId)))
				.orderBy(desc(drafts.createdAt))
				.limit(1);

			const [mergeUserLatest] = await db
				.select({ createdAt: drafts.createdAt })
				.from(drafts)
				.where(and(eq(drafts.userId, mergeUserId), eq(drafts.gameId, gameId)))
				.orderBy(desc(drafts.createdAt))
				.limit(1);

			if (mergeUserLatest && keepUserLatest && mergeUserLatest.createdAt > keepUserLatest.createdAt) {
				console.log('[Discord OAuth] Both have 32 picks, merge user drafted more recently');
				finalUserId = mergeUserId;
			}
		}
	}

	// If we decided to use the merge user's data, swap the IDs
	if (finalUserId === mergeUserId) {
		[keepUserId, mergeUserId] = [mergeUserId, keepUserId];
	}

	await db.transaction(async (trx) => {
		// Transfer any keys from merge user to keep user
		const mergeUserKeys = await trx.select().from(keys).where(eq(keys.userId, mergeUserId));
		
		for (const key of mergeUserKeys) {
			// Check if the key already exists for the keep user
			const [existingKey] = await trx
				.select()
				.from(keys)
				.where(and(
					eq(keys.userId, keepUserId),
					eq(keys.providerId, key.providerId),
					eq(keys.providerUserId, key.providerUserId)
				));

			if (!existingKey) {
				await trx.update(keys)
					.set({ userId: keepUserId })
					.where(and(
						eq(keys.userId, mergeUserId),
						eq(keys.providerId, key.providerId),
						eq(keys.providerUserId, key.providerUserId)
					));
			}
		}

		// Transfer drafts from merge user to keep user (if keep user doesn't have better drafts)
		if (finalUserId === keepUserId) {
			await trx.update(drafts)
				.set({ userId: keepUserId })
				.where(eq(drafts.userId, mergeUserId));
		} else {
			// Delete keep user's drafts since we're using merge user's
			await trx.delete(drafts).where(eq(drafts.userId, keepUserId));
		}

		// Transfer scores
		await trx.update(scores)
			.set({ userId: keepUserId })
			.where(eq(scores.userId, mergeUserId));

		// Delete the merge user
		await trx.delete(users).where(eq(users.id, mergeUserId));
	});

	console.log('[Discord OAuth] Account merge completed successfully', {
		finalUserId: keepUserId,
		deletedUserId: mergeUserId
	});
}

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

		// Handle users without email by creating temp email
		let effectiveEmail = discordUser.email;

		if (!discordUser.email) {
			console.log('[Discord OAuth] No email provided by Discord, creating temp email');
			effectiveEmail = createTempDiscordEmail(discordUser.id.toString());
		}

		const [existingUser] = await db.select().from(users).where(eq(users.email, effectiveEmail));

		if (existingUser) {
			console.log('[Discord OAuth] Existing user found', {
				userId: existingUser.id,
				emailDomain: existingUser.email?.split('@')[1] || 'unknown',
				keysCount: Array.isArray(existingUser.keys) ? existingUser.keys.length : 'unknown',
				isDiscordTempEmail: isDiscordTempEmail(existingUser.email)
			});

			// Handle account merging if this user has a real email and we find a temp email user for this Discord ID
			if (discordUser.email && !isDiscordTempEmail(existingUser.email)) {
				const tempEmailPattern = `${DISCORD_TEMP_EMAIL_PREFIX}${discordUser.id}@temp.nhl-draft-game.local`;
				const [tempUser] = await db.select().from(users).where(eq(users.email, tempEmailPattern));
				
				if (tempUser) {
					console.log('[Discord OAuth] Found temp user to merge with real email user');
					
					// Get default game for merge process
					const [defaultGame] = await db.select().from(games).where(eq(games.defaultGame, true));
					if (defaultGame) {
						await mergeUserAccounts(existingUser.id, tempUser.id, defaultGame.id);
						console.log('[Discord OAuth] Successfully merged temp account with real email account');
					}
				}
			}

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
			console.log('[Discord OAuth] No existing user found with effective email', {
				effectiveEmail,
				hasRealEmail: !!discordUser.email,
				isLookingForTempEmail: !discordUser.email
			});
			
			// If this Discord user has a real email, check if they previously had a temp email account
			if (discordUser.email) {
				const tempEmailPattern = `${DISCORD_TEMP_EMAIL_PREFIX}${discordUser.id}@temp.nhl-draft-game.local`;
				const [tempUser] = await db.select().from(users).where(eq(users.email, tempEmailPattern));
				
				if (tempUser) {
					console.log('[Discord OAuth] Found existing temp user, updating with real email instead of creating new user');
					
					// Defensive validation for the keys array
					let safeKeys: string[] = [];
					try {
						if (Array.isArray(tempUser.keys)) {
							safeKeys = [...tempUser.keys];
						} else {
							console.warn('[Discord OAuth] Keys is not an array, using discord key');
							safeKeys = ['discord'];
						}
					} catch (e) {
						console.error('[Discord OAuth] Error processing keys, using discord key:', e);
						safeKeys = ['discord'];
					}
					
					// Update the temp user with real email and other info
					await db.update(users).set({
						email: discordUser.email,
						avatarUrl: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
						name: discordUser?.username || tempUser.name,
						keys: safeKeys
					}).where(eq(users.id, tempUser.id));
					
					console.log('[Discord OAuth] Successfully updated temp user with real email', {
						userId: tempUser.id,
						newEmail: discordUser.email
					});

					console.log('[Discord OAuth] Creating session for updated user...');
					await createAndSetSession(lucia, tempUser.id, event.cookies);
					console.log('[Discord OAuth] Session created successfully for updated user');
					
					console.log('[Discord OAuth] Login process completed successfully, redirecting to /draft-center');
					return new Response(null, {
						status: 302,
						headers: {
							Location: '/draft-center'
						}
					});
				}
			}
			
			// No existing user found and no temp user to update - create new user
			console.log('[Discord OAuth] Creating brand new user...');
			const userId = generateId(15);

			console.log('[Discord OAuth] Fetching default game...');
			const [defaultGame] = await db.select().from(games).where(eq(games.defaultGame, true))
			
			if (!defaultGame) {
				console.error('[Discord OAuth] No default game found in database');
				throw new Error('No default game configured');
			}

			console.log('[Discord OAuth] Creating new user with transaction...', {
				newUserId: userId,
				email: effectiveEmail,
				emailDomain: effectiveEmail?.split('@')[1] || 'unknown',
				defaultGameId: defaultGame.id,
				isDiscordTempEmail: isDiscordTempEmail(effectiveEmail)
			});

			await db.transaction(async (trx) => {
				await trx.insert(users).values({
					id: userId,
					email: effectiveEmail,
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
				email: effectiveEmail,
				emailDomain: effectiveEmail?.split('@')[1] || 'unknown'
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
