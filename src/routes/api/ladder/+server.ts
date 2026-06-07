import { ladderQuerySchema } from '$lib/remote/leaderboard.schemas';
import { getLadder } from '$lib/server/services/leaderboard-service';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const parsedQuery = ladderQuerySchema.safeParse({
		year: url.searchParams.get('year') || undefined
	});

	if (!parsedQuery.success) {
		return json({ error: 'Invalid ladder query' }, { status: 400 });
	}

	try {
		return json(await getLadder(parsedQuery.data));
	} catch (error) {
		console.error('Error fetching ladder:', error);
		return json({ error: 'Failed to fetch ladder' }, { status: 500 });
	}
};
