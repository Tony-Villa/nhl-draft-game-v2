import { getDraftBoardOrder } from "$lib/helpers/get-draft-board-order";
import { redis } from '$lib/server/redis';
import { db } from '$lib/server/db/index.js';
import { nhlDraft } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { parseTeamAndTrade } from '$lib/helpers/parse-team-and-trade';
import type { DraftBoard } from '$lib/types';

const DRAFT_BOARD_CACHE_TTL = 300;
const NHL_DRAFT_ORDER_CACHE_TTL = 604800;
async function getNhlDraftOrderFromDB(gameYear: string): Promise<DraftBoard[]> {
	try {
		const { games } = await import('$lib/server/db/schema');
		
		const [game] = await db
			.select()
			.from(games)
			.where(eq(games.year, gameYear))
			.limit(1);
			
		if (!game) {
			throw new Error(`No game found for year ${gameYear}`);
		}

		const nhlDraftResults = await db
			.select({
				positionDrafted: nhlDraft.positionDrafted,
				team: nhlDraft.team
			})
			.from(nhlDraft)
			.where(eq(nhlDraft.gameId, parseInt(game.id)))
			.orderBy(nhlDraft.positionDrafted);

		const draftBoard: DraftBoard[] = nhlDraftResults.map(result => {
			const { team, teamLogo, from } = parseTeamAndTrade(result.team);
			
			return {
				draftPosition: result.positionDrafted,
				teamName: team,
				teamLogo,
				prospect: null,
				from,
				points: null,
			};
		});

		return draftBoard;
	} catch (error) {
		console.error('Error getting NHL draft order from DB:', error);
		return [];
	}
}

export async function getCachedDraftBoardOrder(useNhlOrder = false, gameYear?: string): Promise<DraftBoard[]> {
	let cacheKey = 'draft_board_order';
	
	if (useNhlOrder && gameYear) {
		cacheKey = `${gameYear}_nhl_draft_order`;
	}
	
	try {
		const cached = await redis.get(cacheKey);
		if (cached) {
			return JSON.parse(cached);
		}

		let draftBoard: DraftBoard[];
		
		if (useNhlOrder && gameYear) {
			draftBoard = await getNhlDraftOrderFromDB(gameYear);
		} else {
			draftBoard = (await getDraftBoardOrder()) || [];
		}
		
		if (draftBoard && Array.isArray(draftBoard)) {
			const ttl = useNhlOrder ? NHL_DRAFT_ORDER_CACHE_TTL : DRAFT_BOARD_CACHE_TTL;
			await redis.setex(cacheKey, ttl, JSON.stringify(draftBoard));
		}
		
		return draftBoard || [];
		
	} catch (error) {
		console.error('Error getting draft board order:', error);
		if (useNhlOrder && gameYear) {
			return await getNhlDraftOrderFromDB(gameYear) || [];
		} else {
			return await getDraftBoardOrder() || [];
		}
	}
}

export async function clearDraftBoardCache(gameYear?: string): Promise<void> {
	try {
		const keysToDelete = ['draft_board_order'];
		
		if (gameYear) {
			keysToDelete.push(`${gameYear}_nhl_draft_order`);
		}
		
		await redis.del(...keysToDelete);
	} catch (error) {
		console.error('Error clearing draft board cache:', error);
	}
}
