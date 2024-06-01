import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
	schema: './src/lib/server/db/schema',
	driver: 'turso',
	dbCredentials: {
		url: process.env.VITE_TURSO_DB_URL!,
		authToken: process.env.VITE_TURSO_DB_AUTH_TOKEN
	},
	dialect: 'sqlite',
	out: './drizzle'
} satisfies Config;
