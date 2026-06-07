import { draftInsightsQuerySchema } from '$lib/remote/draft-insights.schemas';
import { addUserDraftStatus, getDraftInsights } from '$lib/server/services/draft-insights-service';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const parsedQuery = draftInsightsQuerySchema.safeParse({
		gameId: url.searchParams.get('gameId') || '2',
		position: url.searchParams.get('position') || '7'
	});

	if (!parsedQuery.success) {
		return json({ success: false, error: 'Invalid draft insights query' }, { status: 400 });
	}

	const requestedUserId = url.searchParams.get('userId');
	let userId: string | null = null;

	if (requestedUserId) {
		if (!locals.user?.id) {
			return json(
				{
					success: false,
					error: 'Authentication required to access user-specific data'
				},
				{ status: 401 }
			);
		}

		if (requestedUserId !== locals.user.id) {
			return json(
				{
					success: false,
					error: "Unauthorized: Cannot access another user's draft data"
				},
				{ status: 403 }
			);
		}

		userId = requestedUserId;
	}

	try {
		const coreData = await getDraftInsights(parsedQuery.data);
		const data = userId ? await addUserDraftStatus(coreData, userId) : coreData;

		return json({ success: true, data });
	} catch (error) {
		console.error('Error fetching draft insights:', error);
		return json({ success: false, error: 'Failed to fetch draft insights' }, { status: 500 });
	}
};
