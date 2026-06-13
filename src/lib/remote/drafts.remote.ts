import { command } from '$app/server';
import { error } from '@sveltejs/kit';
import { CURRENT_GAME } from '$env/static/private';
import { getBoardSummaries } from './boards.remote';
import { draftSubmissionCommandSchema } from './drafts.schemas';
import { leaguesAndBoardsEnabled } from '$lib/server/feature-flags';
import { requireRemoteUser } from '$lib/server/remote/request';
import { DraftSubmissionError, submitDraftBoard } from '$lib/server/services/draft-board-service';

export const submitDraftBoardCommand = command(
	draftSubmissionCommandSchema,
	async ({ draftBoardId, picks }) => {
		const user = requireRemoteUser();
		const boardsEnabled = leaguesAndBoardsEnabled();

		try {
			const result = await submitDraftBoard({
				userId: user.id,
				gameId: CURRENT_GAME,
				draftBoardId: boardsEnabled ? draftBoardId : undefined,
				picks
			});

			if (boardsEnabled) {
				await getBoardSummaries({ gameId: CURRENT_GAME }).refresh();
			}

			return result;
		} catch (cause) {
			if (cause instanceof DraftSubmissionError) {
				throw error(
					cause.code === 'board_not_found' || cause.code === 'game_not_found' ? 404 : 400,
					cause.message
				);
			}

			console.error('Remote draft submission failed:', cause);
			throw error(500, 'Failed to submit draft board');
		}
	}
);
