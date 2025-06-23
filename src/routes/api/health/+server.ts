import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { VITE_TURSO_DB_URL, VITE_TURSO_DB_AUTH_TOKEN } from '$env/static/private';

export async function GET(event: RequestEvent): Promise<Response> {
	try {
		// Test basic database connectivity
		const result = await db.select({ count: sql<number>`count(*)` }).from(users);

    console.log(
      {
        VITE_TURSO_DB_URL
      }
    )
		
		const healthCheck = {
			status: 'ok',
			timestamp: new Date().toISOString(),
			database: {
				connected: true,
				userCount: result[0]?.count || 0
			},
			environment: {
				hasDbUrl: !!VITE_TURSO_DB_URL,
				hasDbToken: !!VITE_TURSO_DB_AUTH_TOKEN,
				nodeEnv: process.env.NODE_ENV
			}
		};

		console.log('[Health Check] Database connectivity verified', healthCheck);
		
		return json(healthCheck);
	} catch (error) {
		console.error('[Health Check] Database connectivity failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		});

		return json({
			status: 'error',
			timestamp: new Date().toISOString(),
			database: {
				connected: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			environment: {
				hasDbUrl: !!VITE_TURSO_DB_URL,
				hasDbToken: !!VITE_TURSO_DB_AUTH_TOKEN,
				nodeEnv: process.env.NODE_ENV
			}
		}, { status: 500 });
	}
}
