import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const prospectsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(12),
	search: z.string().trim().max(100).default(''),
	position: z.string().trim().max(50).default(''),
	sortBy: z.enum(['rank', 'name', 'height', 'age']).default('rank'),
	sortOrder: z.enum(['asc', 'desc']).default('asc'),
	year: z.coerce
		.number()
		.int()
		.min(2000)
		.max(currentYear + 1)
		.default(currentYear)
});

export type ProspectsQuery = z.output<typeof prospectsQuerySchema>;
