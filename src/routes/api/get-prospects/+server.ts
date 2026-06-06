import { getProspectsPage } from '$lib/server/services/prospect-browser-service';
import { prospectsQuerySchema } from '$lib/remote/prospects.schemas';
import { json } from '@sveltejs/kit';

export async function GET({ url }: { url: URL }) {
	const parsedQuery = prospectsQuerySchema.safeParse(Object.fromEntries(url.searchParams));

	if (!parsedQuery.success) {
		return json({ error: 'Invalid prospect query' }, { status: 400 });
	}

	try {
		return json(await getProspectsPage(parsedQuery.data));
	} catch (error) {
		console.error('Error fetching prospects:', error);
		return json({ error: 'Failed to fetch prospects' }, { status: 500 });
	}
}
