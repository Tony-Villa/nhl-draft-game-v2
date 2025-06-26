import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { users } from ".";
import { games } from ".";

export const scores = sqliteTable(
  'score',
  {
    userId: text('user_id').notNull().references(() => users.id, {
      onDelete: 'cascade'
    }),
    gameId: text('game_id').notNull().references(() => games.id, {
      onDelete: 'cascade'
    }),
    score: integer('score').notNull().default(0)
  },
  (table) => {
    return {
      userGameUnique: unique().on(table.userId, table.gameId)
    };
  }
)