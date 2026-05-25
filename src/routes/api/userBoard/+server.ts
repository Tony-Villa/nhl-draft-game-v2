import { CURRENT_GAME } from '$env/static/private';
import { getUserDraftBoardCells } from '$lib/server/services/draft-board-service.js';

export async function GET(event) {
	const id = event.url.searchParams.get('board')
	const game_id = event.url.searchParams.get('game') || CURRENT_GAME

  try {

		if(!id || id !== event.locals.user?.id) return new Response(JSON.stringify({savedDraftBoard: []})) 

		const { picks: savedDraftBoard } = await getUserDraftBoardCells(id, game_id);
		

		return new Response(JSON.stringify(savedDraftBoard), {
      "headers": {
        "Content-Type" : "application/json"
      }
    })
	} catch (error) {
		console.error("Error getting game info:" ,error);	
	}
}
