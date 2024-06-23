import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const games = sqliteTable(
  'game',
  {
    id: text('id').notNull().primaryKey().unique(),
    year: text('year').notNull(),
    lockDate: text('lock_date').notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    gamePhase: text('game_phase').notNull().default('open'),
    defaultGame: integer('default_game', {mode: "boolean"}).notNull().default(false)
  }

)