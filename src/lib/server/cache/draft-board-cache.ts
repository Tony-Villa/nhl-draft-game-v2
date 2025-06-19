import { getDraftBoardOrder } from "$lib/helpers/get-draft-board-order";
import { redis } from '$lib/server/redis';
import type { DraftBoard } from '$lib/types';

const DRAFT_BOARD_CACHE_TTL = 300; // 5 minutes cache for draft board order

/**
 * Get draft board order with caching
 */
export async function getCachedDraftBoardOrder(): Promise<DraftBoard[]> {
	const cacheKey = 'draft_board_order';
	
	try {
		// Check cache first
		const cached = await redis.get(cacheKey);
		if (cached) {
			return JSON.parse(cached);
		}

		// Get fresh data
		const draftBoard = await getDraftBoardOrder();
		
		if (draftBoard && Array.isArray(draftBoard)) {
			// Cache the result
			await redis.setex(cacheKey, DRAFT_BOARD_CACHE_TTL, JSON.stringify(draftBoard));
		}
		
		return draftBoard || [];
		
	} catch (error) {
		console.error('Error getting draft board order:', error);
		// Fallback to uncached version
		return await getDraftBoardOrder() || [];
	}
}

/**
 * Clear draft board cache (useful when draft order changes)
 */
export async function clearDraftBoardCache(): Promise<void> {
	try {
		await redis.del('draft_board_order');
	} catch (error) {
		console.error('Error clearing draft board cache:', error);
	}
}
