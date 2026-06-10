import { form, query } from '$app/server';
import { error, invalid } from '@sveltejs/kit';
import { CURRENT_GAME } from '$env/static/private';
import { boardSummariesQuerySchema, renameDraftBoardFormSchema } from './boards.schemas';
import { leaguesAndBoardsEnabled } from '$lib/server/feature-flags';
import { requireRemoteUser } from '$lib/server/remote/request';
import {
	DraftBoardMutationError,
	getUserDraftBoardSummaries,
	renameDraftBoard
} from '$lib/server/services/draft-board-service';

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

export const renameDraftBoardForm = form(
	renameDraftBoardFormSchema,
	async ({ id, name }, issue) => {
		if (!leaguesAndBoardsEnabled()) {
			throw error(404, 'Draft boards are unavailable');
		}

		const user = requireRemoteUser();

		try {
			await renameDraftBoard({
				userId: user.id,
				gameId: CURRENT_GAME,
				draftBoardId: id,
				name
			});
		} catch (cause) {
			if (cause instanceof DraftBoardMutationError) {
				if (cause.code === 'invalid_name' || cause.code === 'duplicate_name') {
					invalid(issue.name(cause.message));
				}

				invalid(cause.message);
			}

			console.error('Remote draft board rename failed:', cause);
			throw error(500, 'Failed to rename draft board');
		}

		await getBoardSummaries({ gameId: CURRENT_GAME }).refresh();

		return {
			draftBoardId: id,
			name
		};
	}
);
