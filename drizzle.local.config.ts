import type { Config } from "drizzle-kit";

export default {
  schema: './src/lib/server/db/schema',
  out: "./drizzle/migrations",
  migrations: {
    prefix: "timestamp",
    table: "__drizzle_migrations__",
    schema: "public",
  },
  dialect: "sqlite",
  dbCredentials: {
    url: "file:./local.db",
  },
} as Config;
