import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, keys } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
	try {
		// SAFE: Only test READ operations, no writes to production data
		const [existingUser] = await db.select().from(users).limit(1);
		
		if (!existingUser) {
			return json({ error: 'No users found for testing' }, { status: 404 });
		}

		console.log('[Test OAuth] SAFE READ-ONLY test of keys handling');
		console.log('[Test OAuth] Sample user keys from production:', {
			keysType: typeof existingUser.keys,
			keysValue: existingUser.keys,
			keysIsArray: Array.isArray(existingUser.keys),
			keysLength: Array.isArray(existingUser.keys) ? existingUser.keys.length : 'N/A'
		});

		// Test the key processing logic WITHOUT writing to database
		const existingKeys = Array.isArray(existingUser.keys) ? existingUser.keys : [];
		
		// Test Discord key logic
		const discordAlreadyExists = existingKeys.includes('discord');
		const authKeysDiscord = discordAlreadyExists 
			? existingKeys 
			: [...existingKeys, 'discord'];
		
		// Test Google key logic  
		const googleAlreadyExists = existingKeys.includes('google');
		const authKeysGoogle = googleAlreadyExists 
			? existingKeys 
			: [...existingKeys, 'google'];
		
		console.log('[Test OAuth] Key processing test results:', {
			originalKeys: existingKeys,
			discordWouldBeAdded: !discordAlreadyExists,
			googleWouldBeAdded: !googleAlreadyExists,
			newDiscordKeys: authKeysDiscord,
			newGoogleKeys: authKeysGoogle
		});

		return json({ 
			success: true, 
			message: 'SAFE read-only test completed - no data modified',
			analysis: {
				originalKeys: existingUser.keys,
				keysType: typeof existingUser.keys,
				isArray: Array.isArray(existingUser.keys),
				discordExists: discordAlreadyExists,
				googleExists: googleAlreadyExists,
				wouldAddDiscord: !discordAlreadyExists,
				wouldAddGoogle: !googleAlreadyExists
			}
		});

	} catch (error) {
		console.error('[Test OAuth] Error during read-only test:', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			type: error?.constructor?.name
		});

		return json({ 
			error: 'Read-only test failed',
			details: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		}, { status: 500 });
	}
}
