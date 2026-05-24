import { json } from '@sveltejs/kit';
import { generateId } from 'better-auth';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { and, eq, desc, count } from 'drizzle-orm';
import { games, users, keys, scores, drafts } from '$lib/server/db/schema';

// Copy the helper functions from the actual callback
const DISCORD_TEMP_EMAIL_PREFIX = 'discord-temp-';

function createTempDiscordEmail(discordUserId: string): string {
	return `${DISCORD_TEMP_EMAIL_PREFIX}${discordUserId}@temp.nhl-draft-game.local`;
}

function isDiscordTempEmail(email: string): boolean {
	return email.startsWith(DISCORD_TEMP_EMAIL_PREFIX) && email.endsWith('@temp.nhl-draft-game.local');
}

async function mergeUserAccounts(keepUserId: string, mergeUserId: string, gameId: string): Promise<void> {
	console.log('[Test Discord] Starting account merge process', {
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

	console.log('[Test Discord] Draft counts for merge decision', {
		keepUserDraftCount,
		mergeUserDraftCount
	});

	// Determine which user's drafts to keep based on your rules
	let finalUserId = keepUserId;
	
	if (keepUserDraftCount === 0 && mergeUserDraftCount > 0) {
		// Keep user has no drafts, merge user has drafts -> use merge user's drafts
		console.log('[Test Discord] Keep user has no drafts, using merge user drafts');
		finalUserId = mergeUserId;
	} else if (keepUserDraftCount > 0 && mergeUserDraftCount > 0) {
		// Both have drafts, use the one with more positions drafted
		if (mergeUserDraftCount > keepUserDraftCount) {
			console.log('[Test Discord] Merge user has more draft positions, using merge user drafts');
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
				console.log('[Test Discord] Both have 32 picks, merge user drafted more recently');
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

	console.log('[Test Discord] Account merge completed successfully', {
		finalUserId: keepUserId,
		deletedUserId: mergeUserId
	});
}

interface TestScenarioRequest {
	scenario: string;
	discordUserId: string;
	email?: string;
	username?: string;
	avatar?: string;
	setupData?: {
		createTempUser?: boolean;
		createRealEmailUser?: boolean;
		realEmail?: string;
		tempUserDraftCount?: number;
		realUserDraftCount?: number;
	};
}

export async function POST(event: RequestEvent): Promise<Response> {
	try {
		const body: TestScenarioRequest = await event.request.json();
		
		console.log('[Test Discord] Starting test scenario:', body.scenario);
		
		// Get default game
		const [defaultGame] = await db.select().from(games).where(eq(games.defaultGame, true));
		if (!defaultGame) {
			throw new Error('No default game configured');
		}

		// Setup test data if needed
		if (body.setupData) {
			await setupTestData(body, defaultGame.id);
		}

		// Simulate the Discord user data
		const mockDiscordUser = {
			id: parseInt(body.discordUserId),
			username: body.username || `testuser${body.discordUserId}`,
			email: body.email || null,
			avatar: body.avatar || 'default',
			login: body.username || `testuser${body.discordUserId}`
		};

		// Run the same logic as the real callback
		const result = await simulateDiscordCallback(mockDiscordUser, defaultGame.id);

		return json({
			success: true,
			scenario: body.scenario,
			result,
			discordUser: mockDiscordUser
		});

	} catch (error) {
		console.error('[Test Discord] Error:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}

async function setupTestData(body: TestScenarioRequest, gameId: string) {
	const discordUserId = body.discordUserId;
	
	// Clean up any existing test data first
	const tempEmail = createTempDiscordEmail(discordUserId);
	await db.delete(users).where(eq(users.email, tempEmail));
	if (body.setupData?.realEmail) {
		await db.delete(users).where(eq(users.email, body.setupData.realEmail));
	}

	// Create temp user if requested
	if (body.setupData?.createTempUser) {
		const tempUserId = generateId(15);
		await db.transaction(async (trx) => {
			await trx.insert(users).values({
				id: tempUserId,
				email: tempEmail,
				avatarUrl: `https://cdn.discordapp.com/avatars/${discordUserId}/default.png`,
				name: `TempUser${discordUserId}`,
				keys: ['discord']
			});

			await trx.insert(keys).values({
				providerId: 'discord',
				providerUserId: discordUserId,
				userId: tempUserId
			});

			await trx.insert(scores).values({
				gameId,
				userId: tempUserId,
				score: 0
			});

			// Add draft data if requested
			if (body.setupData?.tempUserDraftCount) {
				for (let i = 1; i <= body.setupData.tempUserDraftCount; i++) {
					await trx.insert(drafts).values({
						userId: tempUserId,
						gameId,
						positionDrafted: i,
						points: 0,
						team: `Team${i}`,
						prospectId: null
					});
				}
			}
		});
		console.log('[Test Discord] Created temp user with', body.setupData?.tempUserDraftCount || 0, 'drafts');
	}

	// Create real email user if requested
	if (body.setupData?.createRealEmailUser && body.setupData?.realEmail) {
		const realUserId = generateId(15);
		await db.transaction(async (trx) => {
			await trx.insert(users).values({
				id: realUserId,
				email: body.setupData!.realEmail!,
				avatarUrl: `https://cdn.discordapp.com/avatars/${discordUserId}/real.png`,
				name: `RealUser${discordUserId}`,
				keys: ['google'] // Different provider
			});

			await trx.insert(scores).values({
				gameId,
				userId: realUserId,
				score: 0
			});

			// Add draft data if requested
			if (body.setupData?.realUserDraftCount) {
				for (let i = 1; i <= body.setupData.realUserDraftCount; i++) {
					await trx.insert(drafts).values({
						userId: realUserId,
						gameId,
						positionDrafted: i,
						points: 0,
						team: `RealTeam${i}`,
						prospectId: null
					});
				}
			}
		});
		console.log('[Test Discord] Created real email user with', body.setupData?.realUserDraftCount || 0, 'drafts');
	}
}

async function simulateDiscordCallback(discordUser: any, gameId: string) {
	// Handle users without email by creating temp email
	let effectiveEmail = discordUser.email;

	if (!discordUser.email) {
		console.log('[Test Discord] No email provided by Discord, creating temp email');
		effectiveEmail = createTempDiscordEmail(discordUser.id.toString());
	}

	const [existingUser] = await db.select().from(users).where(eq(users.email, effectiveEmail));

	if (existingUser) {
		console.log('[Test Discord] Existing user found', {
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
				console.log('[Test Discord] Found temp user to merge with real email user');
				await mergeUserAccounts(existingUser.id, tempUser.id, gameId);
				console.log('[Test Discord] Successfully merged temp account with real email account');
			}
		}

		// Check for existing Discord key
		const [existingKey] = await db
			.select()
			.from(keys)
			.where(
				and(
					eq(keys.providerId, 'discord'), 
					eq(keys.providerUserId, discordUser.id.toString())
				)
			);

		if (!existingKey) {
			console.log('[Test Discord] No existing Discord key found, linking account...');
			
			// Defensive validation for the keys array
			let safeKeys: string[] = [];
			try {
				if (Array.isArray(existingUser.keys)) {
					safeKeys = [...existingUser.keys];
				} else {
					console.warn('[Test Discord] Keys is not an array, using empty array');
					safeKeys = [];
				}
			} catch (e) {
				console.error('[Test Discord] Error processing keys, using empty array:', e);
				safeKeys = [];
			}
			
			// Only add discord if not already present
			if (!safeKeys.includes('discord')) {
				safeKeys.push('discord');
			}

			await db.transaction(async (trx) => {
				// link discord oauth account to the existing user
				await trx.insert(keys).values({
					providerId: 'discord',
					providerUserId: discordUser.id.toString(),
					userId: existingUser.id
				});

				// Update the user's keys list
				await trx.update(users).set({
					keys: safeKeys
				}).where(eq(users.id, existingUser.id));
			});
			
			console.log('[Test Discord] Successfully linked Discord account to existing user');
		} else {
			console.log('[Test Discord] Existing Discord key found, user already linked');
		}

		return {
			action: 'logged_in_existing_user',
			userId: existingUser.id,
			email: existingUser.email,
			isDiscordTempEmail: isDiscordTempEmail(existingUser.email),
			keysLinked: true
		};

	} else {
		console.log('[Test Discord] No existing user found with effective email', {
			effectiveEmail,
			hasRealEmail: !!discordUser.email,
			isLookingForTempEmail: !discordUser.email
		});
		
		// If this Discord user has a real email, check if they previously had a temp email account
		if (discordUser.email) {
			const tempEmailPattern = `${DISCORD_TEMP_EMAIL_PREFIX}${discordUser.id}@temp.nhl-draft-game.local`;
			const [tempUser] = await db.select().from(users).where(eq(users.email, tempEmailPattern));
			
			if (tempUser) {
				console.log('[Test Discord] Found existing temp user, updating with real email instead of creating new user');
				
				// Defensive validation for the keys array
				let safeKeys: string[] = [];
				try {
					if (Array.isArray(tempUser.keys)) {
						safeKeys = [...tempUser.keys];
					} else {
						console.warn('[Test Discord] Keys is not an array, using discord key');
						safeKeys = ['discord'];
					}
				} catch (e) {
					console.error('[Test Discord] Error processing keys, using discord key:', e);
					safeKeys = ['discord'];
				}
				
				// Update the temp user with real email and other info
				await db.update(users).set({
					email: discordUser.email,
					avatarUrl: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
					name: discordUser?.username || tempUser.name,
					keys: safeKeys
				}).where(eq(users.id, tempUser.id));
				
				console.log('[Test Discord] Successfully updated temp user with real email');

				return {
					action: 'updated_temp_user_with_real_email',
					userId: tempUser.id,
					oldEmail: tempEmailPattern,
					newEmail: discordUser.email,
					preserved_drafts: true
				};
			}
		}
		
		// No existing user found and no temp user to update - create new user
		console.log('[Test Discord] Creating brand new user...');
		const userId = generateId(15);

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
				gameId,
				userId,
				score: 0
			})
		});

		console.log('[Test Discord] Successfully created new user');

		return {
			action: 'created_new_user',
			userId: userId,
			email: effectiveEmail,
			isDiscordTempEmail: isDiscordTempEmail(effectiveEmail)
		};
	}
}

// Helper endpoint to get current state
export async function GET(event: RequestEvent): Promise<Response> {
	const discordUserId = event.url.searchParams.get('discordUserId');
	
	if (!discordUserId) {
		return json({ error: 'discordUserId parameter required' }, { status: 400 });
	}

	const tempEmail = createTempDiscordEmail(discordUserId);
	
	// Get temp user
	const [tempUser] = await db.select().from(users).where(eq(users.email, tempEmail));
	
	// Get any real email users linked to this Discord ID
	const realEmailUsers = await db
		.select({
			user: users,
			key: keys
		})
		.from(users)
		.leftJoin(keys, eq(keys.userId, users.id))
		.where(and(
			eq(keys.providerId, 'discord'),
			eq(keys.providerUserId, discordUserId)
		));

	// Get draft counts if users exist
	let tempUserDraftCount = 0;
	let realUserDraftCounts: any[] = [];

	if (tempUser) {
		const [tempUserDrafts] = await db.select({ count: count() }).from(drafts).where(eq(drafts.userId, tempUser.id));
		tempUserDraftCount = tempUserDrafts?.count || 0;
	}

	for (const realUser of realEmailUsers) {
		if (realUser.user && !isDiscordTempEmail(realUser.user.email)) {
			const [realUserDrafts] = await db.select({ count: count() }).from(drafts).where(eq(drafts.userId, realUser.user.id));
			realUserDraftCounts.push({
				userId: realUser.user.id,
				email: realUser.user.email,
				draftCount: realUserDrafts?.count || 0
			});
		}
	}

	return json({
		discordUserId,
		tempUser: tempUser ? {
			id: tempUser.id,
			email: tempUser.email,
			draftCount: tempUserDraftCount
		} : null,
		realEmailUsers: realUserDraftCounts,
		tempEmail
	});
}
