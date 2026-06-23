import { describe, expect, it } from 'vitest';
import { prospectsQuerySchema } from '$lib/remote/prospects.schemas';
import { getProspectsCacheKey, shouldCacheProspects } from './prospect-browser-service';

describe('prospect browser query support', () => {
	it('applies stable defaults for the initial prospect page', () => {
		expect(prospectsQuerySchema.parse({})).toEqual({
			page: 1,
			limit: 12,
			search: '',
			position: '',
			sortBy: 'rank',
			sortOrder: 'asc',
			year: new Date().getFullYear()
		});
	});

	it('coerces URL-style values and trims user input', () => {
		expect(
			prospectsQuerySchema.parse({
				page: '2',
				limit: '24',
				search: '  smith  ',
				position: ' D ',
				sortBy: 'name',
				sortOrder: 'desc',
				year: String(new Date().getFullYear())
			})
		).toMatchObject({
			page: 2,
			limit: 24,
			search: 'smith',
			position: 'D',
			sortBy: 'name',
			sortOrder: 'desc'
		});
	});

	it('rejects inputs outside the supported query surface', () => {
		expect(prospectsQuerySchema.safeParse({ page: 0 }).success).toBe(false);
		expect(prospectsQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
		expect(prospectsQuerySchema.safeParse({ sortBy: 'score' }).success).toBe(false);
	});

	it('caches stable browse pages but not search or position-filtered results', () => {
		const query = prospectsQuerySchema.parse({
			page: 2,
			search: '',
			position: 'D',
			sortBy: 'rank',
			sortOrder: 'asc'
		});

		expect(getProspectsCacheKey(query)).toContain(`prospects:v2:${query.year}:rank:asc:12::D:2`);
		expect(shouldCacheProspects(query)).toBe(false);
		expect(shouldCacheProspects({ page: 1, search: '', position: '' })).toBe(true);
		expect(shouldCacheProspects({ page: 1, search: 'smith', position: '' })).toBe(false);
		expect(shouldCacheProspects({ page: 11, search: '', position: '' })).toBe(false);
	});
});
