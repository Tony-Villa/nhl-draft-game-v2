import { describe, expect, it } from 'vitest';
import { draftInsightsQuerySchema } from '$lib/remote/draft-insights.schemas';
import { getDraftInsightsCacheKey } from './draft-insights-service';

describe('draft insights query support', () => {
	it('coerces endpoint-style pick values and trims the game id', () => {
		expect(
			draftInsightsQuerySchema.parse({
				gameId: ' 2 ',
				position: '7'
			})
		).toEqual({
			gameId: '2',
			position: 7
		});
	});

	it('rejects unavailable picks and missing game ids', () => {
		expect(draftInsightsQuerySchema.safeParse({ gameId: '2', position: 0 }).success).toBe(false);
		expect(draftInsightsQuerySchema.safeParse({ gameId: '2', position: 33 }).success).toBe(false);
		expect(draftInsightsQuerySchema.safeParse({ gameId: '', position: 7 }).success).toBe(false);
	});

	it('uses the same cache key for remote and endpoint transports', () => {
		const query = draftInsightsQuerySchema.parse({
			gameId: '2',
			position: 7
		});

		expect(getDraftInsightsCacheKey(query)).toBe('draft-insights:2:7');
	});
});
