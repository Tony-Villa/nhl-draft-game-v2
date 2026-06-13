import { expect, test } from '@playwright/test';

test('the draft center does not render component CSS as page content', async ({ page }) => {
	await page.goto('/');

	const leadingText = await page.locator('body').evaluate((body) => {
		const firstMeaningfulNode = Array.from(body.childNodes).find(
			(node) => node.textContent?.trim() || node.nodeType === Node.ELEMENT_NODE
		);

		return firstMeaningfulNode?.nodeType === Node.TEXT_NODE
			? firstMeaningfulNode.textContent?.trim()
			: null;
	});

	expect(leadingText).toBeNull();
});

test.describe('draft-center prospect browser', () => {
	test('keeps the legacy prospect endpoint available as a rollback path', async ({ request }) => {
		const response = await request.get('/api/get-prospects?page=1&limit=1');
		const body = await response.json();

		expect(response.ok()).toBe(true);
		expect(body.prospects).toHaveLength(1);
		expect(body.pagination).toMatchObject({
			currentPage: 1,
			limit: 1
		});

		const invalidResponse = await request.get('/api/get-prospects?page=0');
		expect(invalidResponse.status()).toBe(400);
	});

	test('loads prospects through the remote query', async ({ page }) => {
		const pageErrors: string[] = [];
		page.on('pageerror', (error) => pageErrors.push(error.message));

		await page.goto('/draft-center');

		await expect(page.locator('[data-prospect-source="remote"]')).toBeVisible();
		await page.getByPlaceholder('Search Prospect', { exact: true }).fill('McKenna');
		await expect(page.getByText('Gavin McKenna', { exact: true })).toBeVisible();
		expect(pageErrors).not.toContain(expect.stringContaining('experimental_async_required'));
	});

	test('debounces search and renders an empty remote result without reloading', async ({
		page
	}) => {
		await page.goto('/draft-center');
		await expect(page.locator('[data-prospect-source="remote"]')).toBeVisible();

		await page.getByPlaceholder('Search Prospect', { exact: true }).fill('no-such-prospect-987654');

		await expect(page.getByText('No prospects found', { exact: true })).toBeVisible();
		await expect(page).toHaveURL(/\/draft-center$/);
		await expect(page.locator('[data-prospect-source="remote"]')).toBeVisible();
	});

	test('updates visible cards immediately while a position query is pending', async ({ page }) => {
		await page.goto('/draft-center');
		await expect(page.locator('[data-prospect-source="remote"]')).toBeVisible();
		await expect(page.getByText('Chase Reid', { exact: true })).toBeVisible();

		await page.route('**/_app/remote/**', async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 750));
			await route.continue();
		});

		const centerFilter = page.getByRole('button', { name: 'C', exact: true });
		await centerFilter.click();

		await expect(centerFilter).toHaveAttribute('aria-pressed', 'true');
		await expect(centerFilter).toHaveClass(/translate-x-\[5px\]/);
		await expect(page.locator('[data-prospect-source="optimistic"]')).toBeVisible({
			timeout: 250
		});
		await expect(page.getByText('Chase Reid', { exact: true })).not.toBeVisible({
			timeout: 250
		});
		await expect(page.getByText('Updating prospects...', { exact: true })).toBeVisible();
	});

	test('filters by position without reusing stale prospect card fields', async ({ page }) => {
		await page.goto('/draft-center');
		await expect(page.getByText('Gavin McKenna', { exact: true })).toBeVisible();

		await page.getByRole('button', { name: 'C', exact: true }).click();

		const calebCard = page.locator('.prospect-card').filter({ hasText: 'Caleb Malhotra' });
		await expect(calebCard.getByText('C', { exact: true })).toBeVisible();
		await expect(calebCard).toContainText('183 lbs');
		await expect(calebCard).toContainText('06/02/2008');
		await expect(page.getByText('Gavin McKenna', { exact: true })).not.toBeVisible();
	});

	test('moves one page at a time with next and previous controls', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/draft-center');
		await expect(page.getByText('Gavin McKenna', { exact: true })).toBeVisible();

		await page.getByRole('button', { name: 'Next', exact: true }).click();
		await expect(page.getByText('Rank: 13', { exact: true })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Page 2', exact: true })).toHaveAttribute(
			'data-selected',
			''
		);

		await page.getByRole('button', { name: 'Previous', exact: true }).click();
		await expect(page.getByText('Gavin McKenna', { exact: true })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Page 1', exact: true })).toHaveAttribute(
			'data-selected',
			''
		);
	});

	test('restores an anonymous draft board after reload', async ({ page }) => {
		await page.goto('/draft-center');
		const gavinCard = page.locator('.prospect-card').filter({ hasText: 'Gavin McKenna' });

		await gavinCard.getByRole('button', { name: 'Draft', exact: true }).click();
		await page.getByRole('button', { name: '1 Toronto Maple Leafs logo', exact: true }).click();
		await expect(gavinCard.getByRole('button', { name: 'Undraft', exact: true })).toBeVisible();

		await page.reload();

		const restoredGavinCard = page.locator('.prospect-card').filter({ hasText: 'Gavin McKenna' });
		await expect(
			restoredGavinCard.getByRole('button', { name: 'Undraft', exact: true })
		).toBeVisible();
	});

	test('scrolls to the prospect container with a buffer when changing pages', async ({ page }) => {
		await page.goto('/draft-center');
		await expect(page.getByText('Gavin McKenna', { exact: true })).toBeVisible();

		await page.getByRole('button', { name: 'Next', exact: true }).scrollIntoViewIfNeeded();
		await page.evaluate(() => {
			(window as typeof window & { prospectScroll?: ScrollToOptions }).prospectScroll = undefined;
			const scrollWindow = window as unknown as {
				scrollTo: (options: ScrollToOptions | number, y?: number) => void;
			};
			scrollWindow.scrollTo = (options, y) => {
				(window as typeof window & { prospectScroll?: ScrollToOptions }).prospectScroll =
					typeof options === 'number' ? { left: options, top: y } : options;
			};
		});

		const expectedTop = await page.locator('[data-prospect-container]').evaluate((container) => {
			let containerTop = 0;
			let element: HTMLElement | null = container as HTMLElement;

			while (element) {
				containerTop += element.offsetTop;
				element = element.offsetParent as HTMLElement | null;
			}

			return Math.max(0, containerTop - 240);
		});

		await page.getByRole('button', { name: 'Next', exact: true }).click();

		await expect
			.poll(() =>
				page.evaluate(
					() => (window as typeof window & { prospectScroll?: ScrollToOptions }).prospectScroll
				)
			)
			.toMatchObject({
				top: expectedTop,
				behavior: 'smooth'
			});
	});

	test('uses the finalized game year on the mock draft prospect browser', async ({ page }) => {
		await page.goto('/draft-center/mock-game');

		await expect(page.getByText('Available Prospects (2025)', { exact: true })).toBeVisible();
		await expect(page.getByText('Matthew Schaefer', { exact: true })).toBeVisible();
		await expect(page.getByText('Gavin McKenna', { exact: true })).not.toBeVisible();
	});
});

test.describe('retired remote-function rollback endpoints', () => {
	test('returns 404 for removed read adapters', async ({ request }) => {
		for (const endpoint of [
			'/api/draft-insights',
			'/api/leaderboard',
			'/api/ladder',
			'/api/draft-board',
			'/api/drafted-prospects'
		]) {
			const response = await request.get(endpoint);
			expect(response.status(), endpoint).toBe(404);
		}
	});

	test('returns 404 for the removed draft submission adapter', async ({ request }) => {
		const response = await request.post('/api/draft', {
			data: {
				data: {
					draftboard: []
				}
			}
		});

		expect(response.status()).toBe(404);
	});
});

test.describe('authentication pages', () => {
	test('login page exposes both OAuth providers', async ({ page }) => {
		await page.goto('/auth/login');

		await expect(page).toHaveURL(/\/auth\/login$/);
		await expect(
			page.locator('section.login').getByRole('link', { name: 'discord', exact: true })
		).toHaveAttribute('href', '/auth/login/discord');
		await expect(
			page.locator('section.login').getByRole('link', { name: 'google', exact: true })
		).toHaveAttribute('href', '/auth/login/google');
		await expect(page.locator('section.login')).toHaveAttribute('data-remote-source', 'remote');
	});

	test('register page renders through the shared application layout', async ({ page }) => {
		await page.goto('/auth/register');

		await expect(page).toHaveURL(/\/auth\/register$/);
		await expect(page.getByRole('link', { name: 'Google Login', exact: true })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Discord Login', exact: true })).toBeVisible();
		await expect(
			page.locator('section.login').getByRole('link', { name: 'google', exact: true })
		).toBeVisible();
		await expect(page.locator('section.login')).toHaveAttribute('data-remote-source', 'remote');
	});
});
