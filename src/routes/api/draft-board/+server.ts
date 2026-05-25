import { json } from '@sveltejs/kit';
import { getUserDraftBoardCells } from '$lib/server/services/draft-board-service.js';

export async function GET({ url }: { url: URL }) {
	try {
		const userId = url.searchParams.get('userId');
		const gameId = url.searchParams.get('gameId');

		if (!userId || !gameId) {
			return json({ error: 'userId and gameId are required' }, { status: 400 });
		}

		const { picks: draftBoard } = await getUserDraftBoardCells(userId, gameId);

		return json({
			draftBoard,
			totalPicks: draftBoard.length,
			filledPicks: draftBoard.filter(d => d.prospect).length
		});

	} catch (error) {
		console.error('Error fetching draft board:', error);
		return json(
			{ error: 'Failed to fetch draft board' },
			{ status: 500 }
		);
	}
}
