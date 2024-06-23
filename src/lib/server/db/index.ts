import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { VITE_TURSO_DB_URL, VITE_TURSO_DB_AUTH_TOKEN, VITE_TURSO_DB_AUTH_TOKEN_STAGING } from '$env/static/private';
import { dev } from '$app/environment';

// const url = dev ? 'http://127.0.0.1:8080' : VITE_TURSO_DB_URL;
// const url = VITE_TURSO_DB_URL;
const authToken = dev ? VITE_TURSO_DB_AUTH_TOKEN_STAGING : VITE_TURSO_DB_AUTH_TOKEN

const client = createClient({
	url: VITE_TURSO_DB_URL,
	authToken: VITE_TURSO_DB_AUTH_TOKEN
});
export const db = drizzle(client);
