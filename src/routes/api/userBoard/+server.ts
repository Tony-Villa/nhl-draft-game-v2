import { db } from '$lib/server/db/index.js'
import { drafts } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'

export async function GET(event) {
  try {
		const id = event.url.searchParams.get('board')

		if(!id || id !== event.locals.user?.id) return new Response(JSON.stringify({savedDraftBoard: []})) 

		const savedDraftBoard = await db
				.select()
				.from(drafts)
				.where(eq(drafts.userId, id));
		

		return new Response(JSON.stringify(savedDraftBoard), {
      "headers": {
        "Content-Type" : "application/json"
      }
    })
	} catch (error) {
		console.error("Error getting game info:" ,error);	
	}
}