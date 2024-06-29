import { computePoints } from '$lib/helpers/compute-points'
import { db } from '$lib/server/db/index.js'
import { drafts, nhlDraft, users, scores } from '$lib/server/db/schema'
import { desc, eq, sql } from 'drizzle-orm'

export async function GET() {
  try {

    const ladder = await db.select({
      id: scores.userId,
      score: scores.score,
      playerName: users.name,
      avatar: users.avatarUrl
    }).from(scores).leftJoin(users, eq(users.id, scores.userId)).orderBy(desc(scores.score))


		return new Response(JSON.stringify(ladder), {
      "headers": {
        "Content-Type" : "application/json"
      }
    })
	} catch (error) {
		console.error("Error getting game info:" ,error);	
	}
}