import { defineConfig } from "drizzle-kit";
import { config } from 'dotenv';

config();

export default defineConfig({
  schema: './src/lib/server/db/schema',
  out: "./drizzle/migrations",
  migrations: {
    prefix: "timestamp",
    table: "__drizzle_migrations__",
    schema: "public",
  },
  dialect: "turso",
  dbCredentials: {
    url: process.env.VITE_TURSO_DB_URL!,
    authToken: process.env.VITE_TURSO_DB_AUTH_TOKEN!,
  },
});
