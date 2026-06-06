import { query } from '$app/server';
import { prospectsQuerySchema } from './prospects.schemas';
import { getProspectsPage } from '$lib/server/services/prospect-browser-service';
import { error } from '@sveltejs/kit';

export const getProspects = query(prospectsQuerySchema, async (input) => {
	try {
		return await getProspectsPage(input);
	} catch (cause) {
		console.error('Remote prospect query failed:', cause);
		throw error(500, 'Failed to load prospects');
	}
});
