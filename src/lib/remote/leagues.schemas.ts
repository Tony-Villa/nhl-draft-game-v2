import { z } from 'zod';

export const leagueStandingsQuerySchema = z.object({
	slug: z
		.string()
		.trim()
		.min(1)
		.max(64)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
});

export type LeagueStandingsQuery = z.output<typeof leagueStandingsQuerySchema>;
