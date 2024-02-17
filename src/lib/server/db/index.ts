import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { VITE_TURSO_DB_URL, VITE_TURSO_DB_AUTH_TOKEN } from '$env/static/private';

const client = createClient({
	url: VITE_TURSO_DB_URL,
	authToken: VITE_TURSO_DB_AUTH_TOKEN
	// url: 'http://127.0.0.1:8080'
});
export const db = drizzle(client);
