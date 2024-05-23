import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { VITE_TURSO_DB_URL, VITE_TURSO_DB_AUTH_TOKEN } from '$env/static/private';
import { dev } from '$app/environment';

const url = dev ? 'http://127.0.0.1:8080' : VITE_TURSO_DB_URL;
// const url = VITE_TURSO_DB_URL;

const client = createClient({
	url,
	authToken: VITE_TURSO_DB_AUTH_TOKEN
});
export const db = drizzle(client);
