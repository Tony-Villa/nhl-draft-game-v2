import { db } from '$lib/server/db/index.js'
import { users, scores, games } from '$lib/server/db/schema'
import { desc, eq } from 'drizzle-orm'
import {getYear} from 'date-fns'

export async function GET({url}) {

  const currentYear = getYear(new Date())

  const year = url.searchParams.get('year') || currentYear.toString()

  try {
    const ladder = await db.select({
      id: scores.userId,
      score: scores.score,
      playerName: users.name,
      avatar: users.avatarUrl,
      year: games.year
    }).from(scores).leftJoin(users, eq(users.id, scores.userId)).leftJoin(games, eq(games.id, scores.gameId)).where(eq(games.year, year)).orderBy(desc(scores.score)).limit(10)

		return new Response(JSON.stringify(ladder), {
      "headers": {
        "Content-Type" : "application/json"
      }
    })
	} catch (error) {
		console.error("Error getting game info:" ,error);	
	}
}