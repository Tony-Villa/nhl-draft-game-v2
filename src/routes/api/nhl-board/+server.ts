import { getDraftBoardOrder } from '$lib/helpers/get-draft-board-order'
import { db } from '$lib/server/db/index.js'
import { nhlDraft } from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'

export async function GET({url}: {url: URL}) {

  const gameIdParam = url.searchParams.get('game');
  const gameId = gameIdParam ? parseInt(gameIdParam, 10) : 2;

  try {
		const draftboard = await getDraftBoardOrder();

    const nhlBoard = await db.select({
      positionDrafted: nhlDraft.positionDrafted,
      prospectId: nhlDraft.prospectId,
      prospectName: nhlDraft.prospectName,
      team: nhlDraft.team
    }).from(nhlDraft).where(eq(nhlDraft.gameId, gameId));

    if(nhlBoard.length > 0 && draftboard) {
      nhlBoard.forEach(pick => {
        const draftIndex = pick.positionDrafted - 1;
        if (draftIndex >= 0 && draftIndex < draftboard.length) {
          draftboard[draftIndex].prospect = {
            id: pick.prospectId,
            name: pick.prospectName
          } as any;
        }
      });
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