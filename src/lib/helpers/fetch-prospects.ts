import type { Prospect } from '$lib/types';

export interface ProspectsResponse {
	prospects: Prospect[];
	pagination: {
		currentPage: number;
		totalPages: number;
		totalCount: number;
		limit: number;
		hasNextPage: boolean;
		hasPrevPage: boolean;
	};
}

export interface ProspectsParams {
	page?: number;
	limit?: number;
	search?: string;
	position?: string;
	sortBy?: 'rank' | 'name' | 'height' | 'age';
	sortOrder?: 'asc' | 'desc';
	year?: number;
}

export async function fetchProspects(params: ProspectsParams = {}): Promise<ProspectsResponse> {
	const searchParams = new URLSearchParams();

	// Set default values and add to search params
	searchParams.set('page', params.page?.toString() || '1');
	searchParams.set('limit', params.limit?.toString() || '12');
	
	if (params.search) {
		searchParams.set('search', params.search);
	}
	
	if (params.position) {
		searchParams.set('position', params.position);
	}
	
	if (params.sortBy) {
		searchParams.set('sortBy', params.sortBy);
	}
	
	if (params.sortOrder) {
		searchParams.set('sortOrder', params.sortOrder);
	}
	
	if (params.year) {
		searchParams.set('year', params.year.toString());
	}

	try {
		const response = await fetch(`/api/get-prospects?${searchParams.toString()}`);
		
		if (!response.ok) {
			throw new Error(`Failed to fetch prospects: ${response.statusText}`);
		}

		const data: ProspectsResponse = await response.json();
		return data;
	} catch (error) {
		// Error fetching prospects - logged on server side
		throw error;
	}
}
