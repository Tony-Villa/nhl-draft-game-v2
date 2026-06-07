import { ladderQuerySchema, liveLeaderboardQuerySchema } from '$lib/remote/leaderboard.schemas';
import { describe, expect, it } from 'vitest';

describe('leaderboard query support', () => {
	it('coerces endpoint-style values and trims the game id', () => {
		expect(
			liveLeaderboardQuerySchema.parse({
				gameId: ' 2026 ',
				limit: '3'
			})
		).toEqual({
			gameId: '2026',
			limit: 3
		});
	});

	it('rejects missing game ids and unsupported limits', () => {
		expect(liveLeaderboardQuerySchema.safeParse({ gameId: '', limit: 3 }).success).toBe(false);
		expect(liveLeaderboardQuerySchema.safeParse({ gameId: '2026', limit: 0 }).success).toBe(false);
		expect(liveLeaderboardQuerySchema.safeParse({ gameId: '2026', limit: 101 }).success).toBe(
			false
		);
	});

	it('coerces historical years and rejects unsupported years', () => {
		expect(ladderQuerySchema.parse({ year: '2025' })).toEqual({ year: 2025 });
		expect(ladderQuerySchema.safeParse({ year: 1999 }).success).toBe(false);
		expect(ladderQuerySchema.safeParse({ year: new Date().getFullYear() + 2 }).success).toBe(false);
	});
});
