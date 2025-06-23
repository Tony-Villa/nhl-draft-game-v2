import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Add GET method for easy browser access
export async function GET() {
	return POST();
}

export async function POST() {
	try {
		// Find a user to test with (we'll create a test user if needed)
		let [testUser] = await db.select().from(users).where(eq(users.email, 'oauth-test@example.com'));
		
		if (!testUser) {
			// Create a test user for this specific test
			const testUserId = 'oauth_test_' + Date.now();
			await db.insert(users).values({
				id: testUserId,
				email: 'oauth-test@example.com',
				keys: ['google'], // Start with just Google
				createdAt: new Date().toISOString()
			});
			
			[testUser] = await db.select().from(users).where(eq(users.email, 'oauth-test@example.com'));
			console.log('[Write Test] Created test user:', testUser);
		}

		console.log('[Write Test] Testing actual database WRITE with Turso');
		console.log('[Write Test] Current user keys:', {
			keysType: typeof testUser.keys,
			keysValue: testUser.keys,
			keysIsArray: Array.isArray(testUser.keys)
		});

		// Simulate the exact Discord OAuth scenario
		const existingKeys = Array.isArray(testUser.keys) ? testUser.keys : [];
		const discordExists = existingKeys.includes('discord');
		const authKeys = discordExists ? existingKeys : [...existingKeys, 'discord'];

		console.log('[Write Test] About to attempt database write:', {
			originalKeys: existingKeys,
			discordExists: discordExists,
			newKeys: authKeys,
			authKeysType: typeof authKeys,
			authKeysIsArray: Array.isArray(authKeys)
		});

		// THIS IS THE OPERATION THAT FAILS IN PRODUCTION
		await db.update(users).set({
			keys: authKeys
		}).where(eq(users.id, testUser.id));

		console.log('[Write Test] SUCCESS: Database write completed without error');

		return json({
			success: true,
			message: 'Database write test PASSED - no error occurred',
			testData: {
				userId: testUser.id,
				originalKeys: existingKeys,
				newKeys: authKeys,
				discordWasAdded: !discordExists
			}
		});

	} catch (error) {
		console.error('[Write Test] REPRODUCED THE ERROR:', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			type: error?.constructor?.name
		});

		return json({
			error: 'Database write test FAILED - error reproduced!',
			details: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		}, { status: 500 });
	}
}
