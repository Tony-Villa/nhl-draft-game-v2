import { describe, expect, it } from 'vitest';
import { draftSubmissionCommandSchema } from '$lib/remote/drafts.schemas';

const validPicks = [
	{ draftPosition: 1, team: 'San Jose Sharks', prospectId: 'prospect-1' },
	{ draftPosition: 2, team: 'Chicago Blackhawks', prospectId: null }
];

describe('draft submission command schema', () => {
	it('accepts a board update with filled and empty picks', () => {
		expect(
			draftSubmissionCommandSchema.parse({
				draftBoardId: 42,
				picks: validPicks
			})
		).toEqual({
			draftBoardId: 42,
			picks: validPicks
		});
	});

	it('rejects duplicate draft positions', () => {
		const result = draftSubmissionCommandSchema.safeParse({
			picks: [
				validPicks[0],
				{ draftPosition: 1, team: 'Chicago Blackhawks', prospectId: 'prospect-2' }
			]
		});

		expect(result.success).toBe(false);
	});

	it('rejects duplicate prospects', () => {
		const result = draftSubmissionCommandSchema.safeParse({
			picks: [
				validPicks[0],
				{ draftPosition: 2, team: 'Chicago Blackhawks', prospectId: 'prospect-1' }
			]
		});

		expect(result.success).toBe(false);
	});
});
