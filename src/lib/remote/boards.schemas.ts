import { z } from 'zod';

export const boardSummariesQuerySchema = z.object({
	gameId: z.string().trim().min(1).max(100)
});

export const renameDraftBoardFormSchema = z.object({
	id: z.union([z.string(), z.number()]).transform(Number).pipe(z.number().int().positive()),
	name: z
		.string()
		.trim()
		.min(2, 'Board name must be at least 2 characters.')
		.max(60, 'Board name must be 60 characters or fewer.')
});

export type BoardSummariesQuery = z.output<typeof boardSummariesQuerySchema>;
export type RenameDraftBoardForm = z.output<typeof renameDraftBoardFormSchema>;
