import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {VPS_IMAGE_SERVICE_URL} from '$env/static/private'

// Configuration for your VPS image generation service
const VPS_SERVICE_URL = VPS_IMAGE_SERVICE_URL || 'http://localhost:8081';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		const clientIP = getClientAddress();
		console.log(`[VPS Proxy] Image generation request from ${clientIP}`);
		
		// Get the request body
		const requestBody = await request.json();
		
		// Forward the request to your VPS service
		console.log(`[VPS Proxy] Forwarding to ${VPS_SERVICE_URL}/generate-share-image`);
		
		const vpsResponse = await fetch(`${VPS_SERVICE_URL}/generate-share-image`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'HockeyDraftShowdown-Proxy/1.0',
				'X-Forwarded-For': clientIP,
			},
			body: JSON.stringify(requestBody),
			// Add timeout to prevent hanging
			signal: AbortSignal.timeout(30000) // 30 second timeout
		});
		
		console.log(`[VPS Proxy] VPS service responded with status: ${vpsResponse.status}`);
		
		if (!vpsResponse.ok) {
			const errorText = await vpsResponse.text();
			console.error(`[VPS Proxy] VPS service error: ${vpsResponse.status} - ${errorText}`);
			throw error(vpsResponse.status, `VPS service error: ${errorText}`);
		}
		
		// Get the image data
		const imageBuffer = await vpsResponse.arrayBuffer();
		const contentType = vpsResponse.headers.get('content-type') || 'image/png';
		
		console.log(`[VPS Proxy] Successfully proxied image (${imageBuffer.byteLength} bytes)`);
		
		// Return the image with appropriate headers
		return new Response(imageBuffer, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': vpsResponse.headers.get('cache-control') || 'public, max-age=3600',
				'X-Generated-By': 'VPS-Service'
			}
		});
		
	} catch (err) {
		console.error('[VPS Proxy] Error:', err);
		
		// Handle timeout or network errors
		if (err instanceof Error) {
			if (err.name === 'AbortError') {
				throw error(504, 'VPS service timeout');
			}
			if (err.message.includes('fetch')) {
				throw error(503, 'VPS service unavailable');
			}
		}
		
		throw error(500, 'Failed to generate image via VPS service');
	}
};
