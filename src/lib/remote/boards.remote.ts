import { query } from '$app/server';
import { error } from '@sveltejs/kit';
import { boardSummariesQuerySchema } from './boards.schemas';
import { leaguesAndBoardsEnabled } from '$lib/server/feature-flags';
import { requireRemoteUser } from '$lib/server/remote/request';
import { getUserDraftBoardSummaries } from '$lib/server/services/draft-board-service';

export const getBoardSummaries = query(boardSummariesQuerySchema, async ({ gameId }) => {
	if (!leaguesAndBoardsEnabled()) {
		throw error(404, 'Draft boards are unavailable');
	}

	const user = requireRemoteUser();

	try {
		return await getUserDraftBoardSummaries(user.id, gameId);
	} catch (cause) {
		console.error('Remote board summaries query failed:', cause);
		throw error(500, 'Failed to load draft boards');
	}
});
