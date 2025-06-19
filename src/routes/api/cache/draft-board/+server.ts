import { json } from '@sveltejs/kit';
import { clearDraftBoardCache } from '$lib/server/cache/draft-board-cache.js';

export async function POST() {
	try {
		await clearDraftBoardCache();
		return json({
			success: true,
			message: 'Draft board cache cleared successfully'
		});
	} catch (error) {
		console.error('Error clearing draft board cache:', error);
		return json({
			success: false,
			error: 'Failed to clear draft board cache'
		}, { status: 500 });
	}
}
