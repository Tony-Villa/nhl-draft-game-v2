// import type { Config } from "drizzle-kit";

// export default {
//   schema: './src/lib/server/db/schema',
//   out: "./drizzle/migrations",
//   migrations: {
//     prefix: "timestamp",
//     table: "__drizzle_migrations__",
//     schema: "public",
//   },
//   dialect: "sqlite",
//   dbCredentials: {
//     url: "file:./local.db",
//   },
// } as Config;


import type { Config } from "drizzle-kit";
import { config } from 'dotenv';

export default {
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
    authToken: process.env.VITE_TURSO_DB_AUTH_TOKEN,
  },
} as Config;