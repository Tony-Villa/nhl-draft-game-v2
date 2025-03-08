import { CURRENT_GAME } from '$env/static/private';
import { db } from '$lib/server/db/index.js'
import { drafts } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm'

export async function GET(event) {
	const id = event.url.searchParams.get('board')
	const game_id = event.url.searchParams.get('game') || CURRENT_GAME

  try {

		if(!id || id !== event.locals.user?.id) return new Response(JSON.stringify({savedDraftBoard: []})) 

		const savedDraftBoard = await db
				.select()
				.from(drafts)
				.where(
					and(
						eq(drafts.userId, id), 
						eq(drafts.gameId, game_id)
					)
				);
		

		return new Response(JSON.stringify(savedDraftBoard), {
      "headers": {
        "Content-Type" : "application/json"
      }
    })
	} catch (error) {
		console.error("Error getting game info:" ,error);	
	}
}