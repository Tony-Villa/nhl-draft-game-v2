import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const liveLeaderboardQuerySchema = z.object({
	gameId: z.string().trim().min(1).max(100),
	limit: z.coerce.number().int().min(1).max(100).default(10)
});

export const ladderQuerySchema = z.object({
	year: z.coerce
		.number()
		.int()
		.min(2000)
		.max(currentYear + 1)
		.default(currentYear)
});

export type LiveLeaderboardQuery = z.output<typeof liveLeaderboardQuerySchema>;
export type LadderQuery = z.output<typeof ladderQuerySchema>;
