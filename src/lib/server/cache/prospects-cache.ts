import { redis } from '$lib/server/redis.js';

const CACHE_PREFIX = 'prospects:';

/**
 * Cache management utilities for prospects data
 */
export class ProspectsCache {
	/**
	 * Clear all cached prospects data for a specific year
	 */
	static async clearYearCache(year: number): Promise<number> {
		try {
			const pattern = `${CACHE_PREFIX}${year}:*`;
			const keys = await redis.keys(pattern);
			
			if (keys.length > 0) {
				const deletedCount = await redis.del(...keys);
				return deletedCount;
			}
			
			return 0;
		} catch (error) {
			console.error('Error clearing year cache:', error);
			throw error;
		}
	}

	/**
	 * Clear all cached prospects data
	 */
	static async clearAllCache(): Promise<number> {
		try {
			const pattern = `${CACHE_PREFIX}*`;
			const keys = await redis.keys(pattern);
			
			if (keys.length > 0) {
				const deletedCount = await redis.del(...keys);
				return deletedCount;
			}
			
			return 0;
		} catch (error) {
			console.error('Error clearing all cache:', error);
			throw error;
		}
	}

	/**
	 * Get cache statistics
	 */
	static async getCacheStats(): Promise<{
		totalKeys: number;
		keysByYear: Record<string, number>;
		sampleKeys: string[];
	}> {
		try {
			const pattern = `${CACHE_PREFIX}*`;
			const keys = await redis.keys(pattern);
			
			const keysByYear: Record<string, number> = {};
			
			keys.forEach(key => {
				// Extract year from key pattern: prospects:YEAR:...
				const yearMatch = key.match(/prospects:(\d{4}):/);
				if (yearMatch) {
					const year = yearMatch[1];
					keysByYear[year] = (keysByYear[year] || 0) + 1;
				}
			});
			
			return {
				totalKeys: keys.length,
				keysByYear,
				sampleKeys: keys.slice(0, 10) // First 10 keys as sample
			};
		} catch (error) {
			console.error('Error getting cache stats:', error);
			throw error;
		}
	}

	/**
	 * Warm up cache for common queries
	 * This could be called after data updates to pre-populate frequently accessed data
	 */
	static async warmupCache(year: number, baseUrl: string): Promise<void> {
		try {
			const commonQueries = [
				// First page, default sort (most common)
				{ page: 1, sortBy: 'rank', sortOrder: 'asc' },
				// Position filters
				{ page: 1, sortBy: 'rank', sortOrder: 'asc', position: 'F' },
				{ page: 1, sortBy: 'rank', sortOrder: 'asc', position: 'D' },
				{ page: 1, sortBy: 'rank', sortOrder: 'asc', position: 'G' }
			];

			for (const query of commonQueries) {
				const url = new URL(`${baseUrl}/api/get-prospects`);
				url.searchParams.set('year', year.toString());
				url.searchParams.set('page', query.page.toString());
				url.searchParams.set('sortBy', query.sortBy);
				url.searchParams.set('sortOrder', query.sortOrder);
				if (query.position) {
					url.searchParams.set('position', query.position);
				}

				try {
					// Make a request to populate the cache
					await fetch(url.toString());
				} catch (fetchError) {
				console.warn(`Failed to warm up cache for query:`, query, fetchError);
				}
			}
		} catch (error) {
			console.error('Error during cache warmup:', error);
			throw error;
		}
	}
}
