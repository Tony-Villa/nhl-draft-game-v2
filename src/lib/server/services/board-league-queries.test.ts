import { describe, expect, it } from 'vitest';
import { boardSummariesQuerySchema } from '$lib/remote/boards.schemas';
import { leagueStandingsQuerySchema } from '$lib/remote/leagues.schemas';

describe('board and league remote query support', () => {
	it('trims board game ids and rejects missing ids', () => {
		expect(boardSummariesQuerySchema.parse({ gameId: ' 2026 ' })).toEqual({
			gameId: '2026'
		});
		expect(boardSummariesQuerySchema.safeParse({ gameId: '' }).success).toBe(false);
	});

	it('accepts route-style league slugs and rejects malformed values', () => {
		expect(leagueStandingsQuerySchema.parse({ slug: ' office-pool-2026 ' })).toEqual({
			slug: 'office-pool-2026'
		});
		expect(leagueStandingsQuerySchema.safeParse({ slug: '../private' }).success).toBe(false);
		expect(leagueStandingsQuerySchema.safeParse({ slug: 'Office Pool' }).success).toBe(false);
	});
});
