import { db } from '$lib/server/db/index.js'
import { drafts } from '$lib/server/db/schema';
import type { DraftBoard } from '$lib/types.js';
import { eq } from 'drizzle-orm'

export async function GET(event) {
  try {
    // console.log(request)
		const id = event.url.searchParams.get('board')
		let savedDraftBoard: DraftBoard[] | unknown = []

		if(id) {
			savedDraftBoard = await db
				.select()
				.from(drafts)
				.where(eq(drafts.userId, id));
		}

		return new Response(JSON.stringify(savedDraftBoard), {
      "headers": {
        "Content-Type" : "application/json"
      }
    })
	} catch (error) {
		console.error("Error getting game info:" ,error);	
	}
}