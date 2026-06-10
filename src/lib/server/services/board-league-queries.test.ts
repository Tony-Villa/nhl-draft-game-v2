import { describe, expect, it } from 'vitest';
import { boardSummariesQuerySchema, renameDraftBoardFormSchema } from '$lib/remote/boards.schemas';
import {
	editLeagueFormSchema,
	joinLeagueFormSchema,
	leagueStandingsQuerySchema,
	leaveLeagueFormSchema
} from '$lib/remote/leagues.schemas';

describe('board and league remote query support', () => {
	it('trims board game ids and rejects missing ids', () => {
		expect(boardSummariesQuerySchema.parse({ gameId: ' 2026 ' })).toEqual({
			gameId: '2026'
		});
		expect(boardSummariesQuerySchema.safeParse({ gameId: '' }).success).toBe(false);
	});

	it('normalizes board rename form values and rejects invalid names', () => {
		expect(renameDraftBoardFormSchema.parse({ id: '42', name: '  My Board  ' })).toEqual({
			id: 42,
			name: 'My Board'
		});
		expect(renameDraftBoardFormSchema.safeParse({ id: 'nope', name: 'Valid Board' }).success).toBe(
			false
		);
		expect(renameDraftBoardFormSchema.safeParse({ id: '42', name: 'x' }).success).toBe(false);
	});

	it('accepts route-style league slugs and rejects malformed values', () => {
		expect(leagueStandingsQuerySchema.parse({ slug: ' office-pool-2026 ' })).toEqual({
			slug: 'office-pool-2026'
		});
		expect(leagueStandingsQuerySchema.safeParse({ slug: '../private' }).success).toBe(false);
		expect(leagueStandingsQuerySchema.safeParse({ slug: 'Office Pool' }).success).toBe(false);
	});

	it('normalizes league mutation inputs', () => {
		expect(joinLeagueFormSchema.parse({ inviteCode: ' ab12cd34 ' })).toEqual({
			inviteCode: 'AB12CD34'
		});
		expect(joinLeagueFormSchema.safeParse({ inviteCode: 'bad code' }).success).toBe(false);
		expect(leaveLeagueFormSchema.parse({ slug: ' office-pool-2026 ' })).toEqual({
			slug: 'office-pool-2026'
		});
	});

	it('normalizes editable league details and enforces their limits', () => {
		expect(
			editLeagueFormSchema.parse({
				slug: 'office-pool-2026',
				name: '  Office Pool  ',
				description: '  Friends and coworkers  '
			})
		).toEqual({
			slug: 'office-pool-2026',
			name: 'Office Pool',
			description: 'Friends and coworkers'
		});
		expect(
			editLeagueFormSchema.safeParse({
				slug: 'office-pool-2026',
				name: 'ab',
				description: ''
			}).success
		).toBe(false);
	});
});
