import { getDraftBoardOrder } from '$lib/helpers/get-draft-board-order'
import { getCachedDraftBoardOrder } from '$lib/server/cache/draft-board-cache'
import { db } from '$lib/server/db/index.js'
import { nhlDraft, games } from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'

export async function GET({url}: {url: URL}) {

  const gameIdParam = url.searchParams.get('game');
  const gameIdString = gameIdParam || '2';
  const gameIdInt = parseInt(gameIdString, 10);

  try {
    const game = await db.select({
      gamePhase: games.gamePhase,
      year: games.year
    }).from(games).where(eq(games.id, gameIdString)).limit(1);

    let draftboard;
    if (game.length > 0 && game[0].gamePhase === 'finalized') {
      draftboard = await getCachedDraftBoardOrder(true, game[0].year);
    } else {
      draftboard = await getDraftBoardOrder();
    }

    const nhlBoard = await db.select({
      positionDrafted: nhlDraft.positionDrafted,
      prospectId: nhlDraft.prospectId,
      prospectName: nhlDraft.prospectName,
      team: nhlDraft.team
    }).from(nhlDraft).where(eq(nhlDraft.gameId, gameIdInt));

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