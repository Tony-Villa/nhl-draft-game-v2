import { formatTimeStampToUTC } from '$lib/helpers/format-time-stamp.js'
import { db } from '$lib/server/db/index.js'
import { games } from '$lib/server/db/schema/games.js'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
		const [gameInfo] = await db.select().from(games).where(eq(games.defaultGame, true))

		gameInfo.lockDate = formatTimeStampToUTC(gameInfo.lockDate)
		gameInfo.startDate = formatTimeStampToUTC(gameInfo.startDate)
		gameInfo.endDate = formatTimeStampToUTC(gameInfo.endDate)

		return new Response(JSON.stringify(gameInfo), {
      "headers": {
        "Content-Type" : "application/json"
      }
    })
	} catch (error) {
		console.log("Error getting game info:" ,error);	
	}
}