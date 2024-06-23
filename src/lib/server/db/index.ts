import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { VITE_TURSO_DB_URL, VITE_TURSO_DB_AUTH_TOKEN } from '$env/static/private';
import { dev } from '$app/environment';

const client = createClient({
	url: VITE_TURSO_DB_URL,
	authToken: VITE_TURSO_DB_AUTH_TOKEN
});
export const db = drizzle(client);
