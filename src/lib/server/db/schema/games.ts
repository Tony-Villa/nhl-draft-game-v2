import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const games = sqliteTable(
  'game',
  {
    id: integer('id').notNull().primaryKey().unique(),
    year: text('year').notNull(),
    lockDate: text('lock_date').notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    players: text('players', {mode: 'json'}).$type<string[]>(),
    defaultGame: integer('default_game', {mode: "boolean"}).notNull().default(false)
  }

)