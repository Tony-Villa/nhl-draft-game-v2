import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Cache logos for 30 days since NHL team logos rarely change
const CACHE_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const logoUrl = url.searchParams.get('url');
	
	if (!logoUrl) {
		throw error(400, 'Missing url parameter');
	}
	
	// Only allow NHL logo URLs for security
	if (!logoUrl.includes('assets.nhle.com') || !logoUrl.includes('/logos/')) {
		throw error(400, 'Invalid logo URL - only NHL logos are allowed');
	}
	
	try {
		// Fetch the logo from NHL
		const response = await fetch(logoUrl, {
			headers: {
				'User-Agent': 'HockeyDraftShowdown/1.0',
			}
		});
		
		if (!response.ok) {
			throw error(response.status, `Failed to fetch logo: ${response.statusText}`);
		}
		
		const logoData = await response.arrayBuffer();
		const contentType = response.headers.get('content-type') || 'image/svg+xml';
		
		// Set aggressive caching headers
		setHeaders({
			'Content-Type': contentType,
			'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}, immutable`,
			'CDN-Cache-Control': `max-age=${CACHE_DURATION}`,
			'Vercel-CDN-Cache-Control': `max-age=${CACHE_DURATION}`,
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Headers': 'Content-Type',
		});
		
		return new Response(logoData, {
			headers: {
				'Content-Type': contentType,
			}
		});
		
	} catch (err) {
		console.error('Error proxying team logo:', err);
		throw error(500, 'Failed to proxy team logo');
	}
};
