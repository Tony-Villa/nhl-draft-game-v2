import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { drafts, prospects } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { Prospect } from '$lib/types.js';

export async function GET({ url }: { url: URL }) {
	try {
		const userId = url.searchParams.get('userId');
		const gameId = url.searchParams.get('gameId');

		if (!userId || !gameId) {
			return json({ error: 'userId and gameId are required' }, { status: 400 });
		}

		// Get user's draft board with prospect details
		const userDraftBoard = await db
			.select({
				draftPosition: drafts.positionDrafted,
				team: drafts.team,
				points: drafts.points,
				prospectId: drafts.prospectId,
				// Prospect details
				prospectRank: prospects.rank,
				prospectName: prospects.name,
				prospectPosition: prospects.position,
				prospectNation: prospects.nation,
				prospectTeam: prospects.team,
				prospectLeague: prospects.league,
				prospectBirthDay: prospects.birthDay,
				prospectHeight: prospects.height,
				prospectWeight: prospects.weight,
				prospectShoots: prospects.shoots,
				prospectDraftYear: prospects.draftYear
			})
			.from(drafts)
			.leftJoin(prospects, eq(drafts.prospectId, prospects.id))
			.where(
				and(
					eq(drafts.userId, userId),
					eq(drafts.gameId, gameId)
				)
			)
			.orderBy(drafts.positionDrafted);

		// Transform to match DraftBoard interface
		const draftBoard = userDraftBoard.map(draft => ({
			draftPosition: draft.draftPosition,
			teamName: draft.team,
			team: draft.team, // Alias for compatibility
			points: draft.points,
			prospect: draft.prospectId ? {
				id: draft.prospectId,
				rank: draft.prospectRank,
				name: draft.prospectName,
				position: draft.prospectPosition,
				nation: draft.prospectNation,
				team: draft.prospectTeam,
				league: draft.prospectLeague,
				birthDay: draft.prospectBirthDay,
				height: draft.prospectHeight?.toString() || '',
				weight: draft.prospectWeight?.toString() || '',
				shoots: draft.prospectShoots
			} as Prospect : null
		}));

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
