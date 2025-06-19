import { json } from '@sveltejs/kit';
import { ProspectsCache } from '$lib/server/cache/prospects-cache.js';

export async function GET({ url }: { url: URL }) {
	try {
		const action = url.searchParams.get('action');
		
		switch (action) {
			case 'stats':
				const stats = await ProspectsCache.getCacheStats();
				return json({
					success: true,
					data: stats
				});
				
			case 'clear':
				const year = url.searchParams.get('year');
				let clearedCount: number;
				
				if (year) {
					clearedCount = await ProspectsCache.clearYearCache(parseInt(year));
				} else {
					clearedCount = await ProspectsCache.clearAllCache();
				}
				
				return json({
					success: true,
					message: `Cleared ${clearedCount} cache entries`,
					clearedCount
				});
				
			case 'warmup':
				const warmupYear = url.searchParams.get('year');
				if (!warmupYear) {
					return json({
						success: false,
						error: 'Year parameter required for warmup'
					}, { status: 400 });
				}
				
				const origin = url.origin;
				await ProspectsCache.warmupCache(parseInt(warmupYear), origin);
				
				return json({
					success: true,
					message: `Cache warmup completed for year ${warmupYear}`
				});
				
			default:
				return json({
					success: false,
					error: 'Invalid action. Use: stats, clear, or warmup'
				}, { status: 400 });
		}
	} catch (error) {
		console.error('Cache management error:', error);
		return json({
			success: false,
			error: 'Cache management failed'
		}, { status: 500 });
	}
}

export async function POST({ request }: { request: Request }) {
	try {
		const { action, year } = await request.json();
		
		switch (action) {
			case 'clear':
				let clearedCount: number;
				
				if (year) {
					clearedCount = await ProspectsCache.clearYearCache(year);
				} else {
					clearedCount = await ProspectsCache.clearAllCache();
				}
				
				return json({
					success: true,
					message: `Cleared ${clearedCount} cache entries`,
					clearedCount
				});
				
			case 'warmup':
				if (!year) {
					return json({
						success: false,
						error: 'Year parameter required for warmup'
					}, { status: 400 });
				}
				
				// We need the origin for warmup, but we don't have it in POST
				// For now, we'll skip warmup in POST or make it work without actual HTTP calls
				return json({
					success: false,
					error: 'Warmup not supported via POST. Use GET method.'
				}, { status: 400 });
				
			default:
				return json({
					success: false,
					error: 'Invalid action. Use: clear'
				}, { status: 400 });
		}
	} catch (error) {
		console.error('Cache management error:', error);
		return json({
			success: false,
			error: 'Cache management failed'
		}, { status: 500 });
	}
}
