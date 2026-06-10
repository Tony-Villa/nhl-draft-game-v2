import { json } from '@sveltejs/kit';
import { CURRENT_GAME } from '$env/static/private';
import { draftSubmissionCommandSchema } from '$lib/remote/drafts.schemas';
import { leaguesAndBoardsEnabled } from '$lib/server/feature-flags';
import { DraftSubmissionError, submitDraftBoard } from '$lib/server/services/draft-board-service';

export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ message: 'failed', error: 'Authentication required' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const legacyDraftBoard: Array<Record<string, any>> = Array.isArray(body?.data?.draftboard)
			? body.data.draftboard
			: [];
		const requestedDraftBoardId = Number(body?.data?.draftBoardId) || undefined;
		const input = draftSubmissionCommandSchema.parse({
			draftBoardId: leaguesAndBoardsEnabled() ? requestedDraftBoardId : undefined,
			picks: legacyDraftBoard
				.filter((pick) => pick?.teamName)
				.map((pick) => ({
					draftPosition: pick.draftPosition,
					team: pick.teamName,
					prospectId: pick.prospect?.id || null
				}))
		});

		await submitDraftBoard({
			userId: locals.user.id,
			gameId: CURRENT_GAME,
			...input
		});

		return json({ message: 'success' });
	} catch (cause) {
		console.error('Draft submission error:', cause);

		if (cause instanceof DraftSubmissionError) {
			return json(
				{ message: 'failed', error: cause.message },
				{
					status:
						cause.code === 'board_not_found' || cause.code === 'game_not_found' ? 404 : 400
				}
			);
		}

		return json(
			{
				message: 'failed',
				error: cause instanceof Error ? cause.message : 'Unknown error occurred'
			},
			{ status: 400 }
		);
	}
}
