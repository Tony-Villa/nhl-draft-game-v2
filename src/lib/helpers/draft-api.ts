import type { Prospect } from '$lib/types.js';

/**
 * Fetch drafted prospects for a user/game to initialize permanent draft state
 */
export async function fetchDraftedProspects(userId: string, gameId?: string): Promise<string[]> {
	try {
		const url = new URL('/api/drafted-prospects', window.location.origin);
		url.searchParams.set('userId', userId);
		if (gameId) {
			url.searchParams.set('gameId', gameId);
		}

		const response = await fetch(url.toString());
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const { draftedProspectIds } = await response.json();
		return draftedProspectIds || [];
	} catch (error) {
		// Error fetching drafted prospects - logged on server side
		return [];
	}
}

/**
 * Fetch user's complete draft board with prospect details
 */
export async function fetchDraftBoard(userId: string, gameId: string) {
	try {
		const url = new URL('/api/draft-board', window.location.origin);
		url.searchParams.set('userId', userId);
		url.searchParams.set('gameId', gameId);

		const response = await fetch(url.toString());
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		// Error fetching draft board - logged on server side
		return {
			draftBoard: [],
			totalPicks: 0,
			filledPicks: 0
		};
	}
}

/**
 * Submit draft board to the server
 */
export async function submitDraftBoard(draftboard: any[], user: any): Promise<boolean> {
	try {
		const response = await fetch('/api/draft', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				data: {
					draftboard,
					user
				}
			}),
		});

		const result = await response.json();
		return result.message === 'success';
	} catch (error) {
		// Error submitting draft board - logged on server side
		return false;
	}
}

/**
 * Helper to initialize draft system with permanent drafted prospects
 */
export async function initializeDraftSystem(draftSystem: any, userId: string, gameId?: string) {
	const draftedIds = await fetchDraftedProspects(userId, gameId);
	draftSystem.setPermanentDrafted(draftedIds);
	return draftedIds;
}
