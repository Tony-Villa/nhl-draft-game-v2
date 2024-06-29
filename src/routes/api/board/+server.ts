import { formatTimeStampToUTC } from '$lib/helpers/format-time-stamp.js'
import { getDraftBoardOrder } from '$lib/helpers/get-draft-board-order'
import { db } from '$lib/server/db/index.js'
import { nhlDraft } from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
		const draftboard =  await getDraftBoardOrder()

    const nhlBoard = await  db.select().from(nhlDraft).where(eq(nhlDraft.gameId, 1)) 

    if(nhlBoard.length > 0) {
      nhlBoard.forEach(pick => {
        if(draftboard){
          draftboard[pick.positionDrafted - 1].prospect = {name: pick.prospect} as any
        }
      })
    }
  


		return new Response(JSON.stringify(draftboard), {
      "headers": {
        "Content-Type" : "application/json"
      }
    })
	} catch (error) {
		console.error("Error getting game info:" ,error);	
	}
}