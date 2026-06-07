import { query } from '$app/server';
import { error } from '@sveltejs/kit';
import { draftInsightsQuerySchema } from './draft-insights.schemas';
import { getDraftInsights } from '$lib/server/services/draft-insights-service';

export const getDraftInsightsForPick = query(draftInsightsQuerySchema, async (input) => {
	try {
		return await getDraftInsights(input);
	} catch (cause) {
		console.error('Remote draft insights query failed:', cause);
		throw error(500, 'Failed to load draft insights');
	}
});
