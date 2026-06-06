import { db } from '$lib/server/db/index.js'
import { draftBoardScores, gameEntries, games, users } from '$lib/server/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import {getYear} from 'date-fns'

export async function GET({url}) {

  const currentYear = getYear(new Date())

  const year = url.searchParams.get('year') || currentYear.toString()

  try {
    const ladder = await db.select({
      id: gameEntries.userId,
      score: draftBoardScores.score,
      playerName: users.name,
      avatar: users.avatarUrl,
      year: games.year
    })
    .from(gameEntries)
    .leftJoin(users, eq(users.id, gameEntries.userId))
    .leftJoin(games, eq(games.id, gameEntries.gameId))
    .leftJoin(draftBoardScores, and(
      eq(draftBoardScores.draftBoardId, gameEntries.selectedDraftBoardId),
      eq(draftBoardScores.gameId, gameEntries.gameId)
    ))
    .where(eq(games.year, year))
    .orderBy(desc(draftBoardScores.score))
    .limit(10)

		return new Response(JSON.stringify(ladder), {
      "headers": {
        "Content-Type" : "application/json"
      }
    })
	} catch (error) {
		console.error("Error getting game info:" ,error);	
	}
}
