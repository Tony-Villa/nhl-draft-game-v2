import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { chromium, type Browser } from 'playwright';
import { createHash } from 'crypto';

// Rate limiting: max 3 images per IP per hour
const rateLimits = new Map<string, number[]>();
const RATE_LIMIT = 3;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

// Image cache: cache identical draft picks for 24 hours
const imageCache = new Map<
	string,
	{ image: Buffer; timestamp: number; contentType: string; accessCount: number }
>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const POPULAR_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days for popular drafts

// Browser instance reuse for cost optimization
let browserInstance: Browser | null = null;
let browserLastUsed = 0;
const BROWSER_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Usage tracking for cost monitoring
const usageStats = {
	totalGenerations: 0,
	cacheHits: 0,
	dailyGenerations: new Map<string, number>()
};

async function getBrowser(): Promise<Browser> {
	const now = Date.now();

	if (!browserInstance || now - browserLastUsed > BROWSER_TIMEOUT) {
		if (browserInstance) {
			try {
				await browserInstance.close();
			} catch (err) {
				console.warn('Error closing browser:', err);
			}
		}
		browserInstance = await chromium.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
		});
	}

	browserLastUsed = now;
	return browserInstance;
}

function trackUsage(type: 'generation' | 'cache-hit') {
	const today = new Date().toISOString().split('T')[0];

	if (type === 'generation') {
		usageStats.totalGenerations++;
		const daily = usageStats.dailyGenerations.get(today) || 0;
		usageStats.dailyGenerations.set(today, daily + 1);

		// Alert if daily usage is high
		if (daily > 50) {
			console.warn(`High daily usage detected: ${daily} generations today`);
		}
	} else {
		usageStats.cacheHits++;
	}
}

function checkRateLimit(ip: string): boolean {
	const now = Date.now();
	const requests = rateLimits.get(ip) || [];

	// Remove old requests outside the window
	const recentRequests = requests.filter((time) => now - time < RATE_WINDOW);

	if (recentRequests.length >= RATE_LIMIT) {
		return false;
	}

	// Add current request
	recentRequests.push(now);
	rateLimits.set(ip, recentRequests);
	return true;
}

function createCacheKey(picks: any[]): string {
	// Create a hash of the picks data for caching
	const picksData = picks.map((pick) => ({
		position: pick.position,
		name: pick.name,
		team: pick.team,
		position_played: pick.position_played
	}));
	return createHash('md5').update(JSON.stringify(picksData)).digest('hex');
}

function resolveTeamLogoUrl(logoUrl: string, baseUrl: string): string {
	if (!logoUrl) return '';

	// If it's already a full URL, return as-is
	if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
		return logoUrl;
	}

	// If it's a relative URL, convert to fully qualified URL
	if (logoUrl.startsWith('/')) {
		return baseUrl + logoUrl;
	}

	return logoUrl;
}

function getCacheDuration(cacheKey: string): number {
	const cached = imageCache.get(cacheKey);
	const accessCount = cached?.accessCount || 0;
	// Popular drafts (accessed 5+ times) get extended cache
	return accessCount >= 5 ? POPULAR_CACHE_DURATION : CACHE_DURATION;
}

function cleanupCache() {
	const now = Date.now();
	for (const [key, { timestamp, accessCount }] of imageCache.entries()) {
		const cacheDuration = accessCount >= 5 ? POPULAR_CACHE_DURATION : CACHE_DURATION;
		if (now - timestamp > cacheDuration) {
			imageCache.delete(key);
		}
	}
}

export const POST: RequestHandler = async ({ request, getClientAddress, setHeaders, url }) => {
	try {
		const clientIP = getClientAddress();

		// Rate limiting
		if (!checkRateLimit(clientIP)) {
			throw error(429, 'Rate limit exceeded. Maximum 3 images per hour.');
		}

		const { picks } = await request.json();

		// Validate picks data
		if (!picks || !Array.isArray(picks) || picks.length !== 10) {
			throw error(400, 'Invalid picks data. Must provide exactly 10 picks.');
		}

		// Check cache first
		const cacheKey = createCacheKey(picks);
		const cached = imageCache.get(cacheKey);

		if (cached && Date.now() - cached.timestamp < getCacheDuration(cacheKey)) {
			console.log('Serving cached image for', cacheKey);
			// Increment access count for popularity tracking
			cached.accessCount = (cached.accessCount || 0) + 1;
			imageCache.set(cacheKey, cached);

			trackUsage('cache-hit');
			setHeaders({
				'Content-Type': cached.contentType,
				'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
			});
			return new Response(new Uint8Array(cached.image));
		}

		// Clean up old cache entries
		cleanupCache();

		// Generate new image with Playwright
		console.log('Generating new image for', cacheKey);
		trackUsage('generation');

		const browser = await getBrowser();

		const page = await browser.newPage({
			viewport: { width: 864, height: 640 },
			deviceScaleFactor: 2 // High DPI for better quality
		});

		// Get the base URL for resolving relative logo URLs
		const baseUrl = `${url.protocol}//${url.host}`;

		// Resolve team logo URLs to fully qualified URLs
		const resolvedPicks = picks.map((pick) => ({
			...pick,
			teamLogo: pick.teamLogo ? resolveTeamLogoUrl(pick.teamLogo, baseUrl) : ''
		}));

		// Create the HTML content with your styling
		const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<style>
				@import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
				
				body {
					margin: 0;
					padding: 0;
					font-family: 'Courier New', monospace;
					background: #ffffff;
					width: 864px;
					height: 640px;
					overflow: hidden;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				
				.share-container {
					width: 800px;
					height: 600px;
					background: white;
					padding: 32px;
					border: 5px solid black;
					box-shadow: 8px 8px 0px rgba(0, 0, 0, 1);
					box-sizing: border-box;
					margin: 0;
					display: flex;
					flex-direction: column;
				}
				
				.header {
					text-align: center;
					margin-bottom: 20px;
					flex-shrink: 0;
				}
				
				.title {
					font-size: 32px;
					font-weight: 800;
					text-transform: uppercase;
					letter-spacing: -0.025em;
					color: black;
					margin-bottom: 8px;
					line-height: 1.1;
				}
				
				.divider {
					width: 100%;
					height: 4px;
					background: #ff4f01;
					margin-bottom: 12px;
				}
				
				.website {
					font-size: 16px;
					font-weight: 700;
					color: #374151;
				}
				
				.grid {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 20px;
					flex: 1;
					align-content: start;
				}
				
				.column {
					display: flex;
					flex-direction: column;
					gap: 10px;
				}
				
				.pick {
					display: flex;
					align-items: center;
					gap: 10px;
					padding: 10px 12px;
					border: 3px solid black;
					background: white;
					box-shadow: 4px 4px 0px rgba(0, 0, 0, 1);
					height: 56px;
					box-sizing: border-box;
				}
				
				.position {
					color: black;
					font-weight: 800;
					font-size: 20px;
					z-index: 10;
				}
				
				.logo {
					height: 40px;
					width: 40px;
					object-fit: contain;
					flex-shrink: 0;
				}
				
				.player-info {
					flex: 1;
					min-width: 0;
				}
				
				.player-name {
					font-weight: 800;
					font-size: 16px;
					color: black;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					line-height: 1.2;
					margin-bottom: 2px;
				}
				
				.team-info {
					font-size: 12px;
					font-weight: 700;
					color: #374151;
					text-transform: uppercase;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}
				
				.footer {
					text-align: center;
					margin-top: 16px;
					padding-top: 12px;
					border-top: 3px dashed black;
					flex-shrink: 0;
				}
				
				.footer-text {
					font-size: 12px;
					font-weight: 700;
					color: #4b5563;
					text-transform: uppercase;
					letter-spacing: 0.05em;
				}
			</style>
		</head>
		<body>
			<div class="share-container">
				<div class="header">
					<h1 class="title">My NHL Draft Top 10</h1>
					<div class="divider"></div>
					<p class="website">🏒 HockeyDraftShowdown.com 🏒</p>
				</div>
				
				<div class="grid">
					<div class="column">
						${resolvedPicks
							.slice(0, 5)
							.map(
								(pick) => `
							<div class="pick">
								<span class="position">${pick.position}</span>
								${pick.teamLogo ? `<img class="logo" src="${pick.teamLogo}" alt="Team logo" />` : ''}
								<div class="player-info">
									<p class="player-name">${pick.name}</p>
									<p class="team-info">${pick.team} • ${pick.position_played}</p>
								</div>
							</div>
						`
							)
							.join('')}
					</div>
					<div class="column">
						${resolvedPicks
							.slice(5, 10)
							.map(
								(pick) => `
							<div class="pick">
								<span class="position">${pick.position}</span>
								${pick.teamLogo ? `<img class="logo" src="${pick.teamLogo}" alt="Team logo" />` : ''}
								<div class="player-info">
									<p class="player-name">${pick.name}</p>
									<p class="team-info">${pick.team} • ${pick.position_played}</p>
								</div>
							</div>
						`
							)
							.join('')}
					</div>
				</div>
				
				<div class="footer">
					<p class="footer-text">🏒 Play at HockeyDraftShowdown.com 🏒</p>
				</div>
			</div>
		</body>
		</html>`;

		await page.setContent(html);

		// Wait for images to load
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000); // Extra wait for logos

		// Take screenshot of the entire container without clipping
		const screenshot = await page.screenshot({
			type: 'png',
			fullPage: false,
			clip: {
				x: 0,
				y: 0,
				width: 864,
				height: 640
			}
		});

		await page.close(); // Close page but keep browser for reuse

		// Cache the result with access count
		imageCache.set(cacheKey, {
			image: screenshot,
			timestamp: Date.now(),
			contentType: 'image/png',
			accessCount: 1
		});

		console.log('Image generated and cached:', cacheKey);

		setHeaders({
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=3600'
		});

		return new Response(new Uint8Array(screenshot));
	} catch (err) {
		console.error('Error generating share image:', err);
		throw error(500, 'Failed to generate share image');
	}
};
