import {sql} from 'drizzle-orm'
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { games } from '.'

export const nhlDraft = sqliteTable(
  'nhl_draft',
  {
    id: integer('id').notNull().primaryKey().unique(),
    gameId: integer('game_id').notNull().references(() => games.id, {
      onDelete: 'no action'
    }),
    positionDrafted: integer('position_drafted').notNull(),
    team: text('team').notNull(),
    prospect: text('prospect').notNull(),
    createdAt: integer('created_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`)
  }
)