import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { drafts } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET({ url }: { url: URL }) {
	try {
		const userId = url.searchParams.get('userId');
		const gameId = url.searchParams.get('gameId');

		if (!userId) {
			return json({ error: 'userId is required' }, { status: 400 });
		}

		// Query to get drafted prospect IDs for this user/game
		let whereConditions = [eq(drafts.userId, userId)];
		
		if (gameId) {
			whereConditions.push(eq(drafts.gameId, gameId));
		}

		const draftedProspects = await db
			.select({
				prospectId: drafts.prospectId
			})
			.from(drafts)
			.where(and(...whereConditions));

		const prospectIds = draftedProspects
			.map(d => d.prospectId)
			.filter(id => id !== null);

		return json({
			draftedProspectIds: prospectIds
		});

	} catch (error) {
		console.error('Error fetching drafted prospects:', error);
		return json(
			{ error: 'Failed to fetch drafted prospects' },
			{ status: 500 }
		);
	}
}
