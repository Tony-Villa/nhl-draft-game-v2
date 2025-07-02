import {sql} from 'drizzle-orm'
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { games, prospects } from '.'

export const nhlDraft = sqliteTable(
  'nhl_draft',
  {
    id: integer('id').notNull().primaryKey().unique(),
    gameId: integer('game_id').notNull().references(() => games.id, {
      onDelete: 'no action'
    }),
    positionDrafted: integer('position_drafted').notNull(),
    team: text('team').notNull(),
    prospectId: text('prospect_id').references(() => prospects.id, {
      onDelete: 'no action',
      onUpdate: 'cascade'
    }),
    // Keep prospect name as backup/cache for quick display
    prospectName: text('prospect_name'),
    createdAt: integer('created_at')
			.notNull()
			.default(sql`(cast (unixepoch() as int))`),
    updatedAt: integer('updated_at')
			.default(sql`(cast (unixepoch() as int))`)
  }
)