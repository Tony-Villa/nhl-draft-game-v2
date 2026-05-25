import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { draftBoardPicks, draftBoards } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET({ url }: { url: URL }) {
	try {
		const userId = url.searchParams.get('userId');
		const gameId = url.searchParams.get('gameId');

		if (!userId) {
			return json({ error: 'userId is required' }, { status: 400 });
		}

		let whereConditions = [eq(draftBoards.userId, userId)];
		
		if (gameId) {
			whereConditions.push(eq(draftBoards.gameId, gameId));
		}

		const draftedProspects = await db
			.select({
				prospectId: draftBoardPicks.prospectId
			})
			.from(draftBoardPicks)
			.innerJoin(draftBoards, eq(draftBoardPicks.draftBoardId, draftBoards.id))
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
