import type { Prospect } from '$lib/types';

export interface ProspectsPage {
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
