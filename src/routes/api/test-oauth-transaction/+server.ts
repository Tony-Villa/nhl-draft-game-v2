import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, keys } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// Add GET method for easy browser access
export async function GET() {
	return POST();
}

export async function POST() {
	try {
		// Use the test user we created
		const [testUser] = await db.select().from(users).where(eq(users.email, 'oauth-test@example.com'));
		
		if (!testUser) {
			return json({ error: 'Test user not found' }, { status: 404 });
		}

		console.log('[Transaction Test] Testing EXACT OAuth transaction with Turso');
		console.log('[Transaction Test] Current user keys:', {
			keysType: typeof testUser.keys,
			keysValue: testUser.keys,
			keysIsArray: Array.isArray(testUser.keys)
		});

		// Check if test OAuth key already exists
		const [existingKey] = await db
			.select()
			.from(keys)
			.where(
				and(
					eq(keys.providerId, 'transaction_test'), 
					eq(keys.providerUserId, 'test_user_123')
				)
			);

		if (!existingKey) {
			// Simulate the EXACT OAuth transaction structure
			const existingKeys = Array.isArray(testUser.keys) ? testUser.keys : [];
			const authMethodExists = existingKeys.includes('transaction_test');
			const authKeys = authMethodExists ? existingKeys : [...existingKeys, 'transaction_test'];

			console.log('[Transaction Test] About to run transaction:', {
				existingKeys: existingKeys,
				authMethodExists: authMethodExists,
				newAuthKeys: authKeys,
				authKeysType: typeof authKeys,
				authKeysIsArray: Array.isArray(authKeys),
				willUpdate: !authMethodExists
			});

			if (!authMethodExists) {
				// THIS IS THE EXACT TRANSACTION STRUCTURE THAT FAILS IN PRODUCTION
				await db.transaction(async (trx) => {
					console.log('[Transaction Test] Inside transaction - inserting key...');
					// Insert into keys table
					await trx.insert(keys).values({
						providerId: 'transaction_test',
						providerUserId: 'test_user_123',
						userId: testUser.id
					});

					console.log('[Transaction Test] Inside transaction - updating user keys...');
					// Update user keys - THIS IS WHERE THE ERROR OCCURS IN PRODUCTION
					await trx.update(users).set({
						keys: authKeys
					}).where(eq(users.id, testUser.id));

					console.log('[Transaction Test] Transaction operations completed successfully');
				});

				console.log('[Transaction Test] Transaction committed successfully');
			} else {
				console.log('[Transaction Test] Auth method already exists, skipping transaction');
			}
		} else {
			console.log('[Transaction Test] Key already exists, skipping test');
		}

		return json({
			success: true,
			message: 'Transaction test PASSED - exact OAuth flow works',
			testData: {
				userId: testUser.id,
				hadExistingKey: !!existingKey,
				transactionExecuted: !existingKey
			}
		});

	} catch (error) {
		console.error('[Transaction Test] EXACT OAUTH ERROR REPRODUCED:', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			type: error?.constructor?.name,
			name: error instanceof Error ? error.name : 'Unknown'
		});

		return json({
			error: 'OAUTH TRANSACTION ERROR REPRODUCED!',
			details: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			errorType: error?.constructor?.name
		}, { status: 500 });
	}
}
